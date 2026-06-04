namespace GlobalHatim.Domain.Enums;

/// <summary>
/// JuzAllocation durum makinesi.
/// Geçerli geçişler: Available → Assigned → Completed
/// </summary>
public enum JuzAllocationStatus
{
    /// <summary>Boşta; herhangi bir kullanıcı veya misafir alabilir.</summary>
    Available = 0,

    /// <summary>Bir kullanıcı veya misafir tarafından alındı; okunuyor.</summary>
    Assigned = 1,

    /// <summary>Okuma onaylandı. ReadingLog'a kayıt atıldı.</summary>
    Completed = 2
}
