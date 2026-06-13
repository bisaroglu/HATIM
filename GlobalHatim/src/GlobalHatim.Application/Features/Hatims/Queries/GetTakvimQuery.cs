using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ─────────────────────────────────────────────────────────────────────────────
// Query  —  GET /api/hatims/takvim?kullaniciId={guid}
//
// Ne yapar?
//   Kullanıcının tüm hatim geçmişini (tamamlanan + aktif döngüler) getirir
//   ve her döngü için tarih bilgisiyle birlikte bir liste oluşturur.
//   Bu liste mobil uygulamadaki "52 Haftalık Takvim" ekranını besler.
//
// Nasıl çalışır?
//   1. Kullanıcının tüm JuzAllocation kayıtlarını çeker (tüm döngüler).
//   2. Her allocation için ait olduğu hatimin RotationSchedule'ını bulur
//      → bu schedule, o döngünün başlangıç tarihini verir.
//   3. Her döngü kaydını TakvimHaftaDto'ya dönüştürür.
//   4. Aktif döngü hangsiyse onu aktifHaftaNo olarak işaretler.
// ─────────────────────────────────────────────────────────────────────────────

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Kullanıcının tüm döngülerini (geçmiş + aktif) takvim olarak sorgular.
/// </summary>
public sealed record GetTakvimQuery(Guid KullaniciId) : IRequest<TakvimSonucDto>;

// ── DTOs ──────────────────────────────────────────────────────────────────────

/// <summary>
/// Takvim ekranındaki tek bir satır (bir döngü / bir hafta).
/// </summary>
public sealed record TakvimHaftaDto(
    /// <summary>Döngü numarası — ekranda "Hafta X" olarak gösterilir.</summary>
    int      HaftaNo,

    /// <summary>O döngüde kullanıcıya atanan cüz numarası (1-30).</summary>
    int      CuzNo,

    /// <summary>Döngünün planlandığı başlangıç tarihi.</summary>
    string   BaslangicTarihi,

    /// <summary>Döngünün planlandığı bitiş tarihi.</summary>
    string   BitisTarihi,

    /// <summary>Bu cüz tamamlandı mı?</summary>
    bool     Tamamlandi
);

/// <summary>
/// Takvim ekranının aldığı tam yanıt.
/// </summary>
public sealed record TakvimSonucDto(
    /// <summary>Kullanıcının şu anda aktif olduğu döngü numarası (vurgu için).</summary>
    int                       AktifHaftaNo,

    /// <summary>Tüm döngülerin listesi.</summary>
    IReadOnlyList<TakvimHaftaDto> Takvim
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetTakvimQueryHandler : IRequestHandler<GetTakvimQuery, TakvimSonucDto>
{
    private readonly IApplicationDbContext _db;

    public GetTakvimQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<TakvimSonucDto> Handle(
        GetTakvimQuery    request,
        CancellationToken cancellationToken)
    {
        // 1. Kullanıcının tüm cüz atamalarını getir (tüm döngüler, tüm durumlar).
        //    Sadece kayıtlı kullanıcıya ait (misafir değil).
        var atamalar = await _db.JuzAllocations
            .AsNoTracking()
            .Where(a => a.AssignedUserId == request.KullaniciId
                     && a.Status != JuzAllocationStatus.Available) // Hiç atanmamışları alma
            .Include(a => a.Hatim)
            .OrderBy(a => a.CycleNumber)
            .ToListAsync(cancellationToken);

        // Hiç atama yoksa boş liste dön.
        if (atamalar.Count == 0)
            return new TakvimSonucDto(AktifHaftaNo: 0, Takvim: Array.Empty<TakvimHaftaDto>());

        // 2. Kullanıcının dahil olduğu hatimlerin ID'lerini topla.
        var hatimIdleri = atamalar.Select(a => a.HatimId).Distinct().ToList();

        // 3. Bu hatimlere ait tüm RotationSchedule kayıtlarını getir.
        //    Her kayıt → hangi döngünün hangi tarihte başladığını gösterir.
        var rotasyonlar = await _db.RotationSchedules
            .AsNoTracking()
            .Where(r => hatimIdleri.Contains(r.HatimId))
            .OrderBy(r => r.CycleNumber)
            .ToListAsync(cancellationToken);

        // 4. Hızlı arama için Dictionary: (HatimId, CycleNumber) → ScheduledDate
        var rotasyonHaritasi = rotasyonlar
            .ToDictionary(
                r => (r.HatimId, r.CycleNumber),
                r => r.ScheduledDate
            );

        // 5. Aktif (Assigned) atamayı bul — onun CycleNumber'ı aktif haftadır.
        var aktifAtama    = atamalar.FirstOrDefault(a => a.Status == JuzAllocationStatus.Assigned);
        var aktifHaftaNo  = aktifAtama?.CycleNumber ?? atamalar.Last().CycleNumber;

        // 6. Her atamayı TakvimHaftaDto'ya dönüştür.
        var takvimListesi = atamalar.Select(atama =>
        {
            // Bu döngünün başlangıç tarihini bul (RotationSchedule'dan).
            rotasyonHaritasi.TryGetValue((atama.HatimId, atama.CycleNumber), out var donemBaslangic);

            // Bitiş tarihi = başlangıç + 6 gün (haftalık döngü varsayımı)
            // veya deadline varsa onu kullan.
            var baslangicDate = donemBaslangic != DateOnly.MinValue
                ? donemBaslangic
                : DateOnly.FromDateTime(atama.AssignedAt?.Date ?? DateTime.UtcNow);

            var bitisDate = atama.DeadlineAt.HasValue
                ? DateOnly.FromDateTime(atama.DeadlineAt.Value.Date)
                : baslangicDate.AddDays(6);

            // Türkçe tarih metni
            var kultur          = new System.Globalization.CultureInfo("tr-TR");
            var baslangicMetni  = baslangicDate.ToString("dd MMM yyyy", kultur);
            var bitisMetni      = bitisDate.ToString("dd MMM yyyy", kultur);

            return new TakvimHaftaDto(
                HaftaNo:         atama.CycleNumber,
                CuzNo:           atama.JuzNumber,
                BaslangicTarihi: baslangicMetni,
                BitisTarihi:     bitisMetni,
                Tamamlandi:      atama.Status == JuzAllocationStatus.Completed
            );
        }).ToList();

        return new TakvimSonucDto(
            AktifHaftaNo: aktifHaftaNo,
            Takvim:       takvimListesi
        );
    }
}
