using GlobalHatim.Domain.Enums;
using GlobalHatim.Domain.Events;
using GlobalHatim.Domain.Exceptions;

namespace GlobalHatim.Domain.Entities;

/// <summary>
/// Bir hatim döngüsündeki tek bir cüzün tahsis ve okuma durumunu yönetir.
///
/// Durum makinesi: Available → Assigned → Completed
///
/// Atanan kişi ya kayıtlı bir kullanıcı (AssignedUserId) ya da
/// misafir (GuestFirstName + GuestLastName + GuestToken) olabilir.
/// İkisi aynı anda dolu olamaz — bu kural hem burada hem DB constraint'te korunur.
/// </summary>
public sealed class JuzAllocation : BaseEntity
{
    // ── FK / ilişkiler ───────────────────────────────────────────
    public Guid HatimId { get; private set; }
    public Hatim Hatim { get; private set; } = default!;

    public int CycleNumber { get; private set; }
    public int JuzNumber { get; private set; }   // 1-30 arası
    public JuzLookup JuzInfo { get; private set; } = default!;

    // ── Atanan kişi (XOR kısıtı) ────────────────────────────────
    public Guid? AssignedUserId { get; private set; }
    public User? AssignedUser { get; private set; }

    public string? GuestFirstName { get; private set; }
    public string? GuestLastName { get; private set; }

    /// <summary>
    /// Misafir kullanıcının yalnızca kendi cüzü üzerinde işlem yapabilmesi için
    /// backend tarafından üretilen kısa ömürlü JWT.
    /// Web: LocalStorage | Mobil: SecureStorage
    /// Redis key: "guest:token:{token}" → AllocationId, TTL: 72 saat
    /// </summary>
    public string? GuestToken { get; private set; }

    // ── Durum ────────────────────────────────────────────────────
    public JuzAllocationStatus Status { get; private set; } = JuzAllocationStatus.Available;
    public DateTimeOffset? AssignedAt { get; private set; }
    public DateTimeOffset? DeadlineAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    // ── İlişki ───────────────────────────────────────────────────
    public ReadingLog? ReadingLog { get; private set; }

    // ── Hesaplanmış özellikler ───────────────────────────────────
    public bool IsAssignedToGuest => GuestFirstName is not null;
    public bool IsAssignedToUser  => AssignedUserId is not null;
    public bool IsAvailable       => Status == JuzAllocationStatus.Available;

    public string AssigneeName => IsAssignedToUser
        ? AssignedUser?.FullName ?? "Kayıtlı Kullanıcı"
        : IsAssignedToGuest
            ? $"{GuestFirstName} {GuestLastName}"
            : "—";

    private JuzAllocation() { }

    // ── Factory: boş cüz oluştur ────────────────────────────────
    public static JuzAllocation CreateAvailable(Guid hatimId, int juzNumber, int cycleNumber = 1)
    {
        if (juzNumber is < 1 or > 30)
            throw new DomainException($"Geçersiz cüz numarası: {juzNumber}. 1-30 arasında olmalıdır.");

        return new JuzAllocation
        {
            HatimId     = hatimId,
            JuzNumber   = juzNumber,
            CycleNumber = cycleNumber
        };
    }

    // ── Kayıtlı kullanıcıya atama ────────────────────────────────
    public void AssignToUser(Guid userId, DateTimeOffset deadline)
    {
        EnsureAvailable();

        AssignedUserId = userId;
        Status         = JuzAllocationStatus.Assigned;
        AssignedAt     = DateTimeOffset.UtcNow;
        DeadlineAt     = deadline;
        MarkUpdated();

        RaiseDomainEvent(new JuzAssignedToUserEvent(Id, HatimId, JuzNumber, userId));
    }

    // ── Misafire atama ───────────────────────────────────────────
    public void AssignToGuest(string firstName, string lastName, string guestToken, DateTimeOffset deadline)
    {
        EnsureAvailable();

        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("Misafir adı boş olamaz.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Misafir soyadı boş olamaz.");
        if (string.IsNullOrWhiteSpace(guestToken))
            throw new DomainException("Misafir token'ı boş olamaz.");

        GuestFirstName = firstName.Trim();
        GuestLastName  = lastName.Trim();
        GuestToken     = guestToken;
        Status         = JuzAllocationStatus.Assigned;
        AssignedAt     = DateTimeOffset.UtcNow;
        DeadlineAt     = deadline;
        MarkUpdated();

        RaiseDomainEvent(new JuzAssignedToGuestEvent(Id, HatimId, JuzNumber, GuestFirstName, GuestLastName));
    }

    // ── Okumayı tamamla (Assigned → Completed) ──────────────────
    /// <summary>
    /// Durum Completed'a geçer.
    /// Application katmanı bu çağrının ardından ReadingLog'a kayıt atar
    /// ve UserStats'ı günceller (event-driven).
    /// </summary>
    public void Complete()
    {
        if (Status != JuzAllocationStatus.Assigned)
            throw new DomainException("Sadece 'Assigned' durumundaki cüzler tamamlanabilir.");

        Status      = JuzAllocationStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        MarkUpdated();

        RaiseDomainEvent(new JuzCompletedEvent(Id, HatimId, JuzNumber, CycleNumber, AssignedUserId));
    }

    // ── Serbest bırak (Assigned → Available) ────────────────────
    /// <summary>
    /// Kullanıcı okumaktan vazgeçerse veya deadline aşılırsa cüz serbest bırakılır.
    /// </summary>
    public void Release()
    {
        if (Status != JuzAllocationStatus.Assigned)
            throw new DomainException("Sadece 'Assigned' durumundaki cüzler serbest bırakılabilir.");

        AssignedUserId = null;
        GuestFirstName = null;
        GuestLastName  = null;
        GuestToken     = null;
        AssignedAt     = null;
        DeadlineAt     = null;
        Status         = JuzAllocationStatus.Available;
        MarkUpdated();

        RaiseDomainEvent(new JuzReleasedEvent(Id, HatimId, JuzNumber));
    }

    // ── Yardımcı ────────────────────────────────────────────────
    private void EnsureAvailable()
    {
        if (Status != JuzAllocationStatus.Available)
            throw new DomainException($"Bu cüz şu anda müsait değil. Mevcut durum: {Status}");
    }
}
