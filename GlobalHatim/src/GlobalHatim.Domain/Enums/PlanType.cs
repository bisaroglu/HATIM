namespace GlobalHatim.Domain.Enums;

/// <summary>
/// Hatim rotasyon planı türleri.
/// Plan A, C, D, G tasarım kapsamı dışındadır.
/// </summary>
public enum PlanType
{
    /// <summary>Plan B — Her 2 günde 1 cüz okunur.</summary>
    Every2Days1Juz = 1,

    /// <summary>Plan E — Haftada 1 cüz; Ramazan'da hız değişmez.</summary>
    WeeklyNoAccel = 2,

    /// <summary>
    /// Plan F — Uzun vadeli karma rotasyon.
    /// Ramazan'da: 1 aylık sabit cüz planı.
    /// Yılın geri kalanında: Her 4 ayda bir sonraki cüze geçiş.
    /// </summary>
    LongTermHybrid = 3
}
