using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ─────────────────────────────────────────────────────────────────────────────
// Query  —  GET /api/hatims/buHafta?kullaniciId={guid}
//
// Ne yapar?
//   Gelen kullanıcının o anda "Assigned" durumunda olan aktif cüz atamasını
//   bulur ve mobil Dashboard ekranının ihtiyaç duyduğu tüm bilgileri döndürür.
//
// Ne zaman null döner?
//   Kullanıcının hiç aktif (Assigned) cüzü yoksa sonuç null gelir.
//   Controller bunu 404 olarak iletir.
// ─────────────────────────────────────────────────────────────────────────────

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Kullanıcının aktif cüz atamasını sorgular.
/// </summary>
public sealed record GetBuHaftaQuery(Guid KullaniciId) : IRequest<BuHaftaDto?>;

// ── DTO ───────────────────────────────────────────────────────────────────────

/// <summary>
/// Mobil Dashboard ekranına gönderilen cüz bilgisi.
/// </summary>
public sealed record BuHaftaDto(
    /// <summary>JuzAllocation tablosundaki birincil anahtar — "Tamamlandı" çağrısında kullanılır.</summary>
    Guid     AllocationId,

    /// <summary>Ait olduğu hatimin GUID'i.</summary>
    Guid     HatimId,

    /// <summary>Hatimin başlığı (ekranda gösterilir).</summary>
    string   HatimBasligi,

    /// <summary>Kullanıcıya atanmış cüz numarası (1-30).</summary>
    int      CuzNo,

    /// <summary>Cüzün başladığı sayfa.</summary>
    int      BaslangicSayfasi,

    /// <summary>Cüzün bittiği sayfa.</summary>
    int      BitisSayfasi,

    /// <summary>Sayfaları kısa format: "201-220" gibi.</summary>
    string   SayfaAraligi,

    /// <summary>Döngü (cycle) numarası — mobilde "hafta no" olarak gösterilir.</summary>
    int      HaftaNo,

    /// <summary>Cüzün atandığı tarih (başlangıç).</summary>
    string   BaslangicTarihi,

    /// <summary>Son okuma tarihi (deadline).</summary>
    string   BitisTarihi,

    /// <summary>Bugünden son tarihe kaç gün kaldığı. Negatifse süre geçmiş demektir.</summary>
    int      KalanGun,

    /// <summary>Cüz tamamlandı mı? Assigned → false, Completed → true.</summary>
    bool     Tamamlandi
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetBuHaftaQueryHandler : IRequestHandler<GetBuHaftaQuery, BuHaftaDto?>
{
    private readonly IApplicationDbContext _db;

    public GetBuHaftaQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<BuHaftaDto?> Handle(
        GetBuHaftaQuery   request,
        CancellationToken cancellationToken)
    {
        // 1. Kullanıcının "Assigned" durumundaki cüz atamasını bul.
        //    Birden fazla hatimdeyse en son atananı al (OrderByDescending).
        var atama = await _db.JuzAllocations
            .AsNoTracking()
            .Where(a => a.AssignedUserId == request.KullaniciId
                     && a.Status == JuzAllocationStatus.Assigned)
            .Include(a => a.Hatim)
            .Include(a => a.JuzInfo)   // JuzLookup → sayfa numaraları
            .OrderByDescending(a => a.AssignedAt)
            .FirstOrDefaultAsync(cancellationToken);

        // 2. Aktif atama yoksa → test için sahte (mock) veri dön.
        //    ⚠️ SADECE GELİŞTİRME AŞAMASI — canlıya almadan önce bu bloğu sil,
        //    yerine sadece "return null;" bırak.
        if (atama is null)
        {
            return new BuHaftaDto(
                AllocationId:     Guid.Empty,
                HatimId:          Guid.Empty,
                HatimBasligi:     "🧪 Test Hatimi",
                CuzNo:            1,
                BaslangicSayfasi: 1,
                BitisSayfasi:     20,
                SayfaAraligi:     "1 - 20",
                HaftaNo:          1,
                BaslangicTarihi:  DateTime.UtcNow.ToString("dd MMM yyyy", new System.Globalization.CultureInfo("tr-TR")),
                BitisTarihi:      DateTime.UtcNow.AddDays(5).ToString("dd MMM yyyy", new System.Globalization.CultureInfo("tr-TR")),
                KalanGun:         5,
                Tamamlandi:       false
            );
        }

        // 3. Kalan gün hesapla.
        //    DeadlineAt yoksa varsayılan olarak 7 gün ver.
        var sonTarih   = atama.DeadlineAt ?? DateTimeOffset.UtcNow.AddDays(7);
        var kalanGun   = (int)(sonTarih.Date - DateTime.UtcNow.Date).TotalDays;

        // 4. Tarih metinlerini Türkçe formatta hazırla.
        var baslangicMetni = atama.AssignedAt.HasValue
            ? atama.AssignedAt.Value.ToString("dd MMM yyyy", new System.Globalization.CultureInfo("tr-TR"))
            : "—";
        var bitisMetni = sonTarih.ToString("dd MMM yyyy", new System.Globalization.CultureInfo("tr-TR"));

        // 5. Sayfa aralığı metnini oluştur.
        var sayfaAraligi = atama.JuzInfo is not null
            ? $"{atama.JuzInfo.StartPage} - {atama.JuzInfo.EndPage}"
            : "—";

        return new BuHaftaDto(
            AllocationId:     atama.Id,
            HatimId:          atama.HatimId,
            HatimBasligi:     atama.Hatim.Title,
            CuzNo:            atama.JuzNumber,
            BaslangicSayfasi: atama.JuzInfo?.StartPage ?? 0,
            BitisSayfasi:     atama.JuzInfo?.EndPage   ?? 0,
            SayfaAraligi:     sayfaAraligi,
            HaftaNo:          atama.CycleNumber,
            BaslangicTarihi:  baslangicMetni,
            BitisTarihi:      bitisMetni,
            KalanGun:         kalanGun,
            Tamamlandi:       false   // Assigned durumunda her zaman false
        );
    }
}
