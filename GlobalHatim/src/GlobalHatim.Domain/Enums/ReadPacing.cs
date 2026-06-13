namespace GlobalHatim.Domain.Enums;

/// <summary>
/// Okuma hızı / takvimi.
/// Bir kullanıcının kendisine atanan cüzü ne kadar sürede okuması beklendiğini belirler.
/// AllocateJuzCommand bu değere göre DeadlineAt hesaplar.
/// DB'de string olarak saklanır.
/// </summary>
public enum ReadPacing
{
    /// <summary>Günde 1 Cüz — deadline: +1 gün.</summary>
    Daily1Juz       = 1,

    /// <summary>2 Günde 1 Cüz — deadline: +2 gün.</summary>
    Every2Days1Juz  = 2,

    /// <summary>4 Günde 1 Cüz / Günde 1 Hizb — deadline: +4 gün.</summary>
    Every4Days1Juz  = 3,
}
