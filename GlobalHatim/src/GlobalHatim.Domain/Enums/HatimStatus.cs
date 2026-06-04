namespace GlobalHatim.Domain.Enums;

public enum HatimStatus
{
    /// <summary>Oluşturuldu, başlangıç tarihi henüz gelmedi.</summary>
    Draft = 0,

    /// <summary>Aktif, cüz tahsisleri açık.</summary>
    Active = 1,

    /// <summary>Tüm cüzler tamamlandı, döngü kapandı.</summary>
    Completed = 2,

    /// <summary>Yönetici tarafından arşivlendi.</summary>
    Archived = 3
}
