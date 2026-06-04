using GlobalHatim.Domain.Enums;
using GlobalHatim.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GlobalHatim.Infrastructure.BackgroundWorkers;

/// <summary>
/// Dönerli hatimler (Plan B = WeeklyNoAccel, Plan E/F = LongTermHybrid) için
/// rotation_schedule tablosunu saatlik kontrol eden arka plan işçisi.
///
/// Akış:
///   1. Süresi dolmuş (ScheduledDate &lt;= bugün) ve henüz çalışmamış RotationSchedule satırları alınır.
///   2. İlgili hatimin CurrentCycle'ı artırılır (AdvanceCycle).
///   3. Mevcut döngüdeki tüm Available olmayan cüzler yeni döngü için sıfırlanır.
///   4. RotationSchedule.MarkExecuted() ile satır işaretlenir.
/// </summary>
public sealed class HatimRotationWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<HatimRotationWorker> _logger;

    public HatimRotationWorker(IServiceScopeFactory scopeFactory, ILogger<HatimRotationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HatimRotationWorker başlatıldı. Kontrol aralığı: {Interval}", Interval);

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
                && (rs.Hatim.PlanType == PlanType.WeeklyNoAccel || rs.Hatim.PlanType == PlanType.LongTermHybrid))
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
