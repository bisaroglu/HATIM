using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GlobalHatim.Infrastructure.Persistence.Seeders;

/// <summary>
/// Uygulama ilk açıldığında <c>juz_lookup</c> tablosunu kontrol eder;
/// boşsa 30 cüzü PostgreSQL'e kaydeder, ardından Redis'e yükler.
///
/// Redis anahtarları:
///   "juz:lookup:{juzNumber}"  → tek cüz
///   "juz:lookup:all"          → tüm liste
/// </summary>
public sealed class JuzLookupSeeder
{
    private readonly ApplicationDbContext _db;
    private readonly ICacheService        _cache;
    private readonly ILogger<JuzLookupSeeder> _logger;

    // Cache TTL: statik veri — 30 gün
    private static readonly TimeSpan CacheTtl = TimeSpan.FromDays(30);

    public JuzLookupSeeder(
        ApplicationDbContext     db,
        ICacheService            cache,
        ILogger<JuzLookupSeeder> logger)
    {
        _db     = db;
        _cache  = cache;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var any = await _db.JuzLookup.AnyAsync(ct);
        if (any)
        {
            _logger.LogInformation("juz_lookup tablosu zaten dolu, seed atlandı.");
            await WarmUpCacheAsync(ct);
            return;
        }

        _logger.LogInformation("juz_lookup tablosu boş, seed başlıyor...");

        var juzList = BuildSeedData();
        _db.JuzLookup.AddRange(juzList);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("30 cüz PostgreSQL'e kaydedildi.");

        await WarmUpCacheAsync(ct);
    }

    // ── Cache ─────────────────────────────────────────────────────────────────

    private async Task WarmUpCacheAsync(CancellationToken ct)
    {
        var all = await _db.JuzLookup
            .AsNoTracking()
            .OrderBy(j => j.JuzNumber)
            .ToListAsync(ct);

        // "juz:lookup:all"
        await _cache.SetAsync("juz:lookup:all", all, CacheTtl, ct);

        // "juz:lookup:{n}" — her cüz ayrı ayrı
        foreach (var juz in all)
            await _cache.SetAsync($"juz:lookup:{juz.JuzNumber}", juz, CacheTtl, ct);

        _logger.LogInformation("30 cüz Redis cache'ine yüklendi.");
    }

    // ── Seed verisi ───────────────────────────────────────────────────────────

    /// <summary>
    /// Standart Medine Mushafı (604 sayfa) sayfa numaralarına göre hazırlanmıştır.
    /// İlk 3 ve son cüzde gerçek sure isimleri; aradaki cüzlerde temsili isimler kullanılmıştır.
    /// </summary>
    private static List<JuzLookup> BuildSeedData()
    {
        // (juzNumber, startPage, endPage, surahNamesTr, surahNamesAr)
        var raw = new (int Juz, int Start, int End, string Tr, string Ar)[]
        {
            // ── Gerçek veriler ────────────────────────────────────────────────
            (1,  1,   21,
             "[\"Fatiha\",\"Bakara\"]",
             "[\"الفاتحة\",\"البقرة\"]"),

            (2,  22,  41,
             "[\"Bakara\"]",
             "[\"البقرة\"]"),

            (3,  42,  61,
             "[\"Bakara\",\"Al-i İmran\"]",
             "[\"البقرة\",\"آل عمران\"]"),

            // ── Temsili veriler (4–29) ─────────────────────────────────────
            (4,  62,  81,
             "[\"Al-i İmran\",\"Nisa\"]",
             "[\"آل عمران\",\"النساء\"]"),
            (5,  82,  101,
             "[\"Nisa\",\"Maide\"]",
             "[\"النساء\",\"المائدة\"]"),
            (6,  102, 121,
             "[\"Maide\",\"En'am\"]",
             "[\"المائدة\",\"الأنعام\"]"),
            (7,  122, 141,
             "[\"En'am\",\"A'raf\"]",
             "[\"الأنعام\",\"الأعراف\"]"),
            (8,  142, 161,
             "[\"A'raf\",\"Enfal\"]",
             "[\"الأعراف\",\"الأنفال\"]"),
            (9,  162, 181,
             "[\"Enfal\",\"Tevbe\"]",
             "[\"الأنفال\",\"التوبة\"]"),
            (10, 182, 201,
             "[\"Tevbe\",\"Yunus\"]",
             "[\"التوبة\",\"يونس\"]"),
            (11, 202, 221,
             "[\"Yunus\",\"Hud\",\"Yusuf\"]",
             "[\"يونس\",\"هود\",\"يوسف\"]"),
            (12, 222, 241,
             "[\"Yusuf\",\"Ra'd\",\"İbrahim\"]",
             "[\"يوسف\",\"الرعد\",\"إبراهيم\"]"),
            (13, 242, 261,
             "[\"İbrahim\",\"Hicr\",\"Nahl\"]",
             "[\"إبراهيم\",\"الحجر\",\"النحل\"]"),
            (14, 262, 281,
             "[\"Nahl\",\"İsra\",\"Kehf\"]",
             "[\"النحل\",\"الإسراء\",\"الكهف\"]"),
            (15, 282, 301,
             "[\"Kehf\",\"Meryem\",\"Taha\"]",
             "[\"الكهف\",\"مريم\",\"طه\"]"),
            (16, 302, 321,
             "[\"Taha\",\"Enbiya\"]",
             "[\"طه\",\"الأنبياء\"]"),
            (17, 322, 341,
             "[\"Enbiya\",\"Hac\",\"Müminun\"]",
             "[\"الأنبياء\",\"الحج\",\"المؤمنون\"]"),
            (18, 342, 361,
             "[\"Müminun\",\"Nur\",\"Furkan\"]",
             "[\"المؤمنون\",\"النور\",\"الفرقان\"]"),
            (19, 362, 381,
             "[\"Furkan\",\"Şuara\",\"Neml\"]",
             "[\"الفرقان\",\"الشعراء\",\"النمل\"]"),
            (20, 382, 401,
             "[\"Neml\",\"Kasas\",\"Ankebut\"]",
             "[\"النمل\",\"القصص\",\"العنكبوت\"]"),
            (21, 402, 421,
             "[\"Ankebut\",\"Rum\",\"Lokman\",\"Secde\"]",
             "[\"العنكبوت\",\"الروم\",\"لقمان\",\"السجدة\"]"),
            (22, 422, 441,
             "[\"Ahzab\",\"Sebe\",\"Fatır\"]",
             "[\"الأحزاب\",\"سبأ\",\"فاطر\"]"),
            (23, 442, 461,
             "[\"Yasin\",\"Saffat\",\"Sad\",\"Zümer\"]",
             "[\"يس\",\"الصافات\",\"ص\",\"الزمر\"]"),
            (24, 462, 481,
             "[\"Zümer\",\"Mümin\",\"Fussilet\"]",
             "[\"الزمر\",\"غافر\",\"فصلت\"]"),
            (25, 482, 501,
             "[\"Fussilet\",\"Şura\",\"Zuhruf\",\"Duhan\",\"Casiye\"]",
             "[\"فصلت\",\"الشورى\",\"الزخرف\",\"الدخان\",\"الجاثية\"]"),
            (26, 502, 521,
             "[\"Ahkaf\",\"Muhammed\",\"Fetih\",\"Hucurat\",\"Kaf\"]",
             "[\"الأحقاف\",\"محمد\",\"الفتح\",\"الحجرات\",\"ق\"]"),
            (27, 522, 541,
             "[\"Zariyat\",\"Tur\",\"Necm\",\"Kamer\",\"Rahman\",\"Vakıa\",\"Hadid\"]",
             "[\"الذاريات\",\"الطور\",\"النجم\",\"القمر\",\"الرحمن\",\"الواقعة\",\"الحديد\"]"),
            (28, 542, 561,
             "[\"Mücadele\",\"Haşr\",\"Mümtehine\",\"Saf\",\"Cuma\",\"Münafikun\",\"Tegabün\",\"Talak\",\"Tahrim\"]",
             "[\"المجادلة\",\"الحشر\",\"الممتحنة\",\"الصف\",\"الجمعة\",\"المنافقون\",\"التغابن\",\"الطلاق\",\"التحريم\"]"),
            (29, 562, 581,
             "[\"Mülk\",\"Kalem\",\"Hakka\",\"Mearic\",\"Nuh\",\"Cin\",\"Müzzemmil\",\"Müddessir\",\"Kıyamet\",\"İnsan\",\"Mürselat\"]",
             "[\"الملك\",\"القلم\",\"الحاقة\",\"المعارج\",\"نوح\",\"الجن\",\"المزمل\",\"المدثر\",\"القيامة\",\"الإنسان\",\"المرسلات\"]"),

            // ── Gerçek veri: Cüz 30 ───────────────────────────────────────
            (30, 582, 604,
             "[\"Nebe\",\"Naziat\",\"Abese\",\"Tekvir\",\"İnfitar\",\"Mutaffifin\",\"İnşikak\",\"Buruc\",\"Tarık\",\"A'la\",\"Gaşiye\",\"Fecr\",\"Beled\",\"Şems\",\"Leyl\",\"Duha\",\"İnşirah\",\"Tin\",\"Alak\",\"Kadir\",\"Beyyine\",\"Zilzal\",\"Adiyat\",\"Karia\",\"Tekasür\",\"Asr\",\"Hümeze\",\"Fil\",\"Kureyş\",\"Maun\",\"Kevser\",\"Kafirun\",\"Nasr\",\"Tebbet\",\"İhlas\",\"Felak\",\"Nas\"]",
             "[\"النبأ\",\"النازعات\",\"عبس\",\"التكوير\",\"الانفطار\",\"المطففين\",\"الانشقاق\",\"البروج\",\"الطارق\",\"الأعلى\",\"الغاشية\",\"الفجر\",\"البلد\",\"الشمس\",\"الليل\",\"الضحى\",\"الشرح\",\"التين\",\"العلق\",\"القدر\",\"البينة\",\"الزلزلة\",\"العاديات\",\"القارعة\",\"التكاثر\",\"العصر\",\"الهمزة\",\"الفيل\",\"قريش\",\"الماعون\",\"الكوثر\",\"الكافرون\",\"النصر\",\"المسد\",\"الإخلاص\",\"الفلق\",\"الناس\"]"),
        };

        return raw
            .Select(r => JuzLookup.Create(r.Juz, r.Start, r.End, r.Tr, r.Ar))
            .ToList();
    }
}
