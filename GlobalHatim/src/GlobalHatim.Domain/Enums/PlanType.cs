namespace GlobalHatim.Domain.Enums;

/// <summary>
/// Hatimin türü / kategorisi.
/// Frontende "Sabit", "Döngülü", "Günlük", "Haftalık" olarak yansır.
/// DB'de string olarak saklanır (.HasConversion&lt;string&gt;()).
/// </summary>
public enum PlanType
{
    /// <summary>Sabit hatim — belirli bir süre, belirli bir tempo.</summary>
    Fixed  = 1,

    /// <summary>Döngülü hatim — hatim tamamlandıkça yeni döngü başlar.</summary>
    Cyclic = 2,

    /// <summary>Günlük hatim — her gün 1 cüz okunur.</summary>
    Daily  = 3,

    /// <summary>Haftalık hatim — haftada 1 cüz okunur.</summary>
    Weekly = 4,
}
