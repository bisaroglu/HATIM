using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace GlobalHatim.Infrastructure.Persistence.Converters;

/// <summary>
/// ReadPacing ↔ DB string dönüşümü.
/// Eski enum adlarını güncel değerlere zararsızca eşler; bilinmeyen bir string
/// geldiğinde <see cref="ReadPacing.Every2Days1Juz"/> döner.
///
/// NOT: EF Core expression-tree kısıtı nedeniyle TryGetValue'nun out değişkeni
/// doğrudan lambda içinde kullanılamaz; dönüşüm mantığı static metotta tutulur.
/// </summary>
public sealed class ReadPacingConverter : ValueConverter<ReadPacing, string>
{
    private static readonly Dictionary<string, ReadPacing> LegacyMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // ── Eski isimler ──────────────────────────────────────────────────
            { "WeeklyNoAccel",   ReadPacing.Every4Days1Juz  },
            { "WeeklyAccel",     ReadPacing.Every2Days1Juz  },
            { "DailyAccel",      ReadPacing.Daily1Juz       },
            { "DailyNoAccel",    ReadPacing.Daily1Juz       },
            { "Daily",           ReadPacing.Daily1Juz       },
            { "Every7Days1Juz",  ReadPacing.Every4Days1Juz  },
            // ── Güncel isimler ────────────────────────────────────────────────
            { "Daily1Juz",       ReadPacing.Daily1Juz       },
            { "Every2Days1Juz",  ReadPacing.Every2Days1Juz  },
            { "Every4Days1Juz",  ReadPacing.Every4Days1Juz  },
        };

    private static ReadPacing FromDb(string dbValue) =>
        LegacyMap.TryGetValue(dbValue, out var result) ? result : ReadPacing.Every2Days1Juz;

    public ReadPacingConverter()
        : base(
            readPacing => readPacing.ToString(),  // C# → DB
            dbValue    => FromDb(dbValue))        // DB → C#
    { }
}
