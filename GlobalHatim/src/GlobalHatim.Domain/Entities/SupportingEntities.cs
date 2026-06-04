using GlobalHatim.Domain.Enums;

namespace GlobalHatim.Domain.Entities;

// ── UserLevel ────────────────────────────────────────────────────────────────
public sealed class UserLevel : BaseEntity
{
    public string NameTr { get; private set; } = default!;
    public string NameEn { get; private set; } = default!;
    public int MinJuzRead { get; private set; }
    public string? BadgeIcon { get; private set; }
    public int SortOrder { get; private set; }

    public ICollection<User> Users { get; private set; } = [];
}

// ── UserStats ─────────────────────────────────────────────────────────────────
/// <summary>
/// Denormalize istatistik tablosu. Redis cache ile önbelleklenir.
/// Redis key: "user:stats:{userId}"
/// </summary>
public sealed class UserStats
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;

    public int TotalJuzRead { get; set; }
    public int TotalHatimsJoined { get; set; }
    public int TotalHatimsCompleted { get; set; }
    public int TotalHatimsCreated { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // EF Core için
    private UserStats() { }

    public static UserStats CreateForUser(Guid userId) => new() { UserId = userId };

    public void IncrementJuzRead() { TotalJuzRead++; UpdatedAt = DateTimeOffset.UtcNow; }
    public void IncrementHatimsJoined() { TotalHatimsJoined++; UpdatedAt = DateTimeOffset.UtcNow; }
    public void IncrementHatimsCompleted() { TotalHatimsCompleted++; UpdatedAt = DateTimeOffset.UtcNow; }
    public void IncrementHatimsCreated() { TotalHatimsCreated++; UpdatedAt = DateTimeOffset.UtcNow; }
}

// ── UserSettings ──────────────────────────────────────────────────────────────
public sealed class UserSettings
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;
    public bool NotificationEnabled { get; set; } = true;
    public string Language { get; set; } = "tr";
    public string Theme { get; set; } = "dark";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    private UserSettings() { }
    public static UserSettings CreateDefault(Guid userId) => new() { UserId = userId };
}

// ── HatimCategory ─────────────────────────────────────────────────────────────
public sealed class HatimCategory
{
    public int Id { get; private set; }
    public string NameTr { get; private set; } = default!;
    public string NameEn { get; private set; } = default!;
    public string? Icon { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<Hatim> Hatims { get; private set; } = [];
}

// ── HatimParticipant ──────────────────────────────────────────────────────────
public sealed class HatimParticipant : BaseEntity
{
    public Guid HatimId { get; private set; }
    public Hatim Hatim { get; private set; } = default!;
    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;
    public ParticipantRole Role { get; private set; } = ParticipantRole.Reader;
    public DateTimeOffset JoinedAt { get; private set; } = DateTimeOffset.UtcNow;

    private HatimParticipant() { }

    public static HatimParticipant Create(Guid hatimId, Guid userId, ParticipantRole role) =>
        new() { HatimId = hatimId, UserId = userId, Role = role };
}

// ── HatimJoinRequest ──────────────────────────────────────────────────────────
public sealed class HatimJoinRequest : BaseEntity
{
    public Guid HatimId { get; private set; }
    public Hatim Hatim { get; private set; } = default!;
    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;

    public JoinRequestStatus Status { get; private set; } = JoinRequestStatus.Pending;
    public DateTimeOffset RequestedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReviewedAt { get; private set; }
    public Guid? ReviewedBy { get; private set; }

    private HatimJoinRequest() { }

    public static HatimJoinRequest Create(Guid hatimId, Guid userId) =>
        new() { HatimId = hatimId, UserId = userId };

    public void Approve(Guid reviewerUserId)
    {
        Status     = JoinRequestStatus.Approved;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedBy = reviewerUserId;
    }

    public void Reject(Guid reviewerUserId)
    {
        Status     = JoinRequestStatus.Rejected;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedBy = reviewerUserId;
    }
}

// ── JuzLookup ─────────────────────────────────────────────────────────────────
/// <summary>
/// Statik seed tablosu. Uygulama startup'ında tamamen Redis'e yüklenir.
/// Redis key: "juz:lookup:{juzNumber}" ve "juz:lookup:all" (Hash)
/// </summary>
public sealed class JuzLookup
{
    public int JuzNumber { get; private set; }        // 1-30
    public int StartPage { get; private set; }
    public int EndPage { get; private set; }
    public string AssociatedSurahNamesTr { get; private set; } = default!;  // JSON array
    public string AssociatedSurahNamesAr { get; private set; } = default!;

    public ICollection<JuzAllocation> Allocations { get; private set; } = [];

    // EF Core için
    private JuzLookup() { }

    public static JuzLookup Create(
        int juzNumber,
        int startPage,
        int endPage,
        string surahNamesTr,
        string surahNamesAr) => new()
    {
        JuzNumber             = juzNumber,
        StartPage             = startPage,
        EndPage               = endPage,
        AssociatedSurahNamesTr = surahNamesTr,
        AssociatedSurahNamesAr = surahNamesAr
    };
}

// ── RotationSchedule ──────────────────────────────────────────────────────────
/// <summary>
/// Plan B, E, F için döngü takvimi.
/// BackgroundWorker her gece bu tabloyu kontrol eder;
/// scheduled_date bugün veya geçmişte ise döngüyü ilerletir.
/// </summary>
public sealed class RotationSchedule : BaseEntity
{
    public Guid HatimId { get; private set; }
    public Hatim Hatim { get; private set; } = default!;
    public int CycleNumber { get; private set; }
    public DateOnly ScheduledDate { get; private set; }
    public bool IsRamadanPeriod { get; private set; }
    public DateOnly? ActualRotationDate { get; private set; }

    private RotationSchedule() { }

    public static RotationSchedule Create(Guid hatimId, int cycleNumber, DateOnly scheduledDate, bool isRamadan = false) =>
        new() { HatimId = hatimId, CycleNumber = cycleNumber, ScheduledDate = scheduledDate, IsRamadanPeriod = isRamadan };

    public void MarkExecuted() => ActualRotationDate = DateOnly.FromDateTime(DateTime.UtcNow);
}

// ── ReadingLog ────────────────────────────────────────────────────────────────
/// <summary>
/// JuzAllocation.Complete() çağrıldıktan sonra Application katmanı
/// bu tabloya bir satır ekler. Audit trail + Geçmiş ekranı + Level hesabı için.
/// </summary>
public sealed class ReadingLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid HatimId { get; private set; }
    public Hatim Hatim { get; private set; } = default!;
    public Guid AllocationId { get; private set; }
    public JuzAllocation Allocation { get; private set; } = default!;
    public Guid? UserId { get; private set; }       // null → misafir
    public User? User { get; private set; }
    public int JuzNumber { get; private set; }
    public int CycleNumber { get; private set; }
    public DateTimeOffset ConfirmedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ReadingLog() { }

    public static ReadingLog Create(Guid hatimId, Guid allocationId, int juzNumber, int cycleNumber, Guid? userId) =>
        new()
        {
            HatimId      = hatimId,
            AllocationId = allocationId,
            JuzNumber    = juzNumber,
            CycleNumber  = cycleNumber,
            UserId       = userId
        };
}

// ── ContactMessage ────────────────────────────────────────────────────────────
public sealed class ContactMessage
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = default!;
    public string? EmailOrPhone { get; private set; }
    public string Message { get; private set; } = default!;
    public bool IsRead { get; set; }
    public bool IsReplied { get; set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactMessage() { }

    public static ContactMessage Create(string name, string message, string? emailOrPhone = null)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new Exceptions.DomainException("Ad boş olamaz.");
        if (string.IsNullOrWhiteSpace(message)) throw new Exceptions.DomainException("Mesaj boş olamaz.");

        return new ContactMessage { Name = name.Trim(), Message = message.Trim(), EmailOrPhone = emailOrPhone?.Trim() };
    }
}
