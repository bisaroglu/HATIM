using GlobalHatim.Domain.Enums;
using GlobalHatim.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GlobalHatim.Infrastructure.BackgroundWorkers;

/// <summary>
/// Döngülü hatimler (PlanType = Cyclic) için
/// rotation_schedule tablosunu saatlik kontrol eden arka plan işçisi.
///
/// Akış:
///   1. Süresi dolmuş (ScheduledDate &lt;= bugün) ve henüz çalışmamış RotationSchedule satırları alınır.
///   2. İlgili hatimin CurrentCycle'ı artırılır (AdvanceCycle).
///   3. Mevcut döngüdeki tüm Available olmayan cüzler yeni döngü için sıfırlanır.
///   4. RotationSchedule.MarkExecuted() ile satır işaretlenir.
///
/// Tasarım zamanı araçları (dotnet ef migrations, dotnet ef database update) hostu
/// kısa süreliğine başlatır ama <see cref="IHostApplicationLifetime.ApplicationStarted"/>
/// sinyalini göndermeden durdurur. Worker bu sinyal gelene kadar bekleyerek DB sorgusunu
/// asla tetiklemez — migration Catch-22'sini köklü biçimde çözer.
/// </summary>
public sealed class HatimRotationWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory         _scopeFactory;
    private readonly ILogger<HatimRotationWorker> _logger;
    private readonly IHostApplicationLifetime     _appLifetime;

    public HatimRotationWorker(
        IServiceScopeFactory         scopeFactory,
        ILogger<HatimRotationWorker> logger,
        IHostApplicationLifetime     appLifetime)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _appLifetime  = appLifetime;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HatimRotationWorker kaydedildi. ApplicationStarted bekleniyor…");

        // ── Uygulama tamamen ayağa kalkana kadar bekle ────────────────────────
        // ApplicationStarted + stoppingToken'ı bağla:
        //   • Normal çalışma  → ApplicationStarted tetiklenir → döngüye gir
        //   • dotnet ef araçları → ApplicationStarted asla gelmez,
        //     host durduğunda stoppingToken iptal olur → worker sessizce çıkar
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            _appLifetime.ApplicationStarted,
            stoppingToken);

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            // ApplicationStarted geldiyse devam et; yoksa (stoppingToken) erken çık.
            if (!_appLifetime.ApplicationStarted.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "HatimRotationWorker: uygulama başlamadan önce durduruldu (tasarım zamanı veya erken çıkış).");
                return;
            }
        }

        _logger.LogInformation("HatimRotationWorker başladı. Kontrol aralığı: {Interval}", Interval);

        // ── Ana döngü ─────────────────────────────────────────────────────────
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRotationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HatimRotationWorker döngüsünde hata oluştu.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessRotationsAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        // Süresi dolmuş, çalışmamış rotasyonları al
        var dueSchedules = await db.RotationSchedules
            .Include(rs => rs.Hatim)
                .ThenInclude(h => h.JuzAllocations)
            .Where(rs =>
                rs.ScheduledDate <= today
                && rs.ActualRotationDate == null
                && rs.Hatim.Status == HatimStatus.Active
                && rs.Hatim.PlanType == PlanType.Cyclic)   // Sadece döngülü hatimler rotate olur
            .ToListAsync(ct);

        if (dueSchedules.Count == 0)
        {
            _logger.LogDebug("Bugün işlenecek rotation schedule yok.");
            return;
        }

        _logger.LogInformation("{Count} adet rotation schedule işlenecek.", dueSchedules.Count);

        foreach (var schedule in dueSchedules)
        {
            try
            {
                var hatim = schedule.Hatim;

                // Mevcut döngüdeki cüzleri sıfırla (Release) — okunanlar hariç
                var currentAllocations = hatim.JuzAllocations
                    .Where(a => a.CycleNumber == hatim.CurrentCycle
                             && a.Status == JuzAllocationStatus.Assigned)
                    .ToList();

                foreach (var alloc in currentAllocations)
                    alloc.Release();

                // Yeni döngü için Available cüzler oluştur (mevcut cycle'da Available olanlar zaten var,
                // yeni cycle için yeni satırlar eklenir)
                hatim.AdvanceCycle();

                var newCycle = hatim.CurrentCycle;
                for (var juzNo = 1; juzNo <= 30; juzNo++)
                {
                    var exists = hatim.JuzAllocations
                        .Any(a => a.CycleNumber == newCycle && a.JuzNumber == juzNo);

                    if (!exists)
                    {
                        db.JuzAllocations.Add(
                            Domain.Entities.JuzAllocation.CreateAvailable(hatim.Id, juzNo, newCycle));
                    }
                }

                schedule.MarkExecuted();

                _logger.LogInformation(
                    "Hatim {HatimId} için döngü {Cycle} başlatıldı.",
                    hatim.Id, newCycle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Hatim {HatimId} rotation işlenirken hata.", schedule.HatimId);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
