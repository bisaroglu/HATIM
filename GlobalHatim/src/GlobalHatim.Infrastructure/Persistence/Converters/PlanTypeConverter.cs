using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace GlobalHatim.Infrastructure.Persistence.Converters;

/// <summary>
/// PlanType ↔ DB string dönüşümü.
/// Refactoring sırasında ortaya çıkan eski enum adlarını (ör. "WeeklyNoAccel")
/// güncel değerlere zararsızca eşler; bilinmeyen bir string geldiğinde uygulama
/// çökmesi yerine <see cref="PlanType.Weekly"/> döner.
///
/// NOT: EF Core expression-tree kısıtı nedeniyle TryGetValue'nun out değişkeni
/// doğrudan lambda içinde kullanılamaz; dönüşüm mantığı static metotta tutulur.
/// </summary>
public sealed class PlanTypeConverter : ValueConverter<PlanType, string>
{
    private static readonly Dictionary<string, PlanType> LegacyMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // ── Eski isimler ──────────────────────────────────────────────────
            { "WeeklyNoAccel",  PlanType.Weekly  },
            { "WeeklyAccel",    PlanType.Weekly  },
            { "FixedNoAccel",   PlanType.Fixed   },
            { "FixedAccel",     PlanType.Fixed   },
            { "CyclicNoAccel",  PlanType.Cyclic  },
            { "CyclicAccel",    PlanType.Cyclic  },
            { "DailyNoAccel",   PlanType.Daily   },
            { "DailyAccel",     PlanType.Daily   },
            // ── Güncel isimler (case-insensitive güvencesi için) ──────────────
            { "Fixed",          PlanType.Fixed   },
            { "Cyclic",         PlanType.Cyclic  },
            { "Daily",          PlanType.Daily   },
            { "Weekly",         PlanType.Weekly  },
        };

    // Expression tree içinde out bildirimi yasak; static metot üzerinden çağrılır.
    private static PlanType FromDb(string dbValue) =>
        LegacyMap.TryGetValue(dbValue, out var result) ? result : PlanType.Weekly;

    public PlanTypeConverter()
        : base(
            planType => planType.ToString(),  // C# → DB
            dbValue  => FromDb(dbValue))      // DB → C#
    { }
}
