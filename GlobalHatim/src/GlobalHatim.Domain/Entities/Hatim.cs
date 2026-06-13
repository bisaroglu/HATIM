using GlobalHatim.Domain.Enums;
using GlobalHatim.Domain.Events;
using GlobalHatim.Domain.Exceptions;

namespace GlobalHatim.Domain.Entities;

public sealed class Hatim : BaseEntity
{
    // ── Temel bilgiler ───────────────────────────────────────────
    public string Title { get; private set; } = default!;
    public string? Description { get; private set; }

    // ── İlişkiler (FK) ──────────────────────────────────────────
    public Guid CreatorUserId { get; private set; }
    public User Creator { get; private set; } = default!;
    public int? CategoryId { get; private set; }
    public HatimCategory? Category { get; private set; }

    // ── Plan ve durum ────────────────────────────────────────────
    /// <summary>Hatim türü: Fixed, Cyclic, Daily, Weekly</summary>
    public PlanType PlanType { get; private set; }

    /// <summary>Okuma hızı — cüz başına ayrılan süre; DeadlineAt hesabında kullanılır.</summary>
    public ReadPacing ReadPacing { get; private set; } = ReadPacing.Every2Days1Juz;

    public HatimStatus Status { get; private set; } = HatimStatus.Draft;

    // ── Erişim kontrolü ─────────────────────────────────────────
    public bool IsPublic { get; private set; } = true;

    /// <summary>
    /// IsPublic=false olduğunda backend tarafından otomatik üretilir.
    /// Bu kodu bilen kullanıcılar HatimJoinRequest'i bypass eder.
    /// </summary>
    public string? InviteCode { get; private set; }

    // ── Döngü takibi ────────────────────────────────────────────
    /// <summary>Şu an kaçıncı turda olunduğu (1'den başlar).</summary>
    public int CurrentCycle { get; private set; } = 1;

    /// <summary>Toplam kaç döngü tamamlandı (BackgroundWorker günceller).</summary>
    public int TotalCycles { get; private set; } = 0;

    // ── Zaman ───────────────────────────────────────────────────
    public DateOnly StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }

    // ── İlişki koleksiyonları ────────────────────────────────────
    public ICollection<HatimParticipant> Participants { get; private set; } = [];
    public ICollection<JuzAllocation> JuzAllocations { get; private set; } = [];
    public ICollection<RotationSchedule> RotationSchedules { get; private set; } = [];
    public ICollection<HatimJoinRequest> JoinRequests { get; private set; } = [];

    // ── Hesaplanmış özellikler ───────────────────────────────────
    /// <summary>Döngülü hatim → tüm cüzler tamamlandığında yeni döngü başlar.</summary>
    public bool IsRotating => PlanType is PlanType.Cyclic;

    private Hatim() { }

    // ── Factory method ───────────────────────────────────────────
    public static Hatim Create(
        string title,
        string? description,
        Guid creatorUserId,
        PlanType planType,
        ReadPacing readPacing,
        DateOnly startDate,
        bool isPublic = true,
        int? categoryId = null,
        DateOnly? endDate = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Hatim başlığı boş olamaz.");
        if (startDate < DateOnly.FromDateTime(DateTime.UtcNow.Date))
            throw new DomainException("Başlangıç tarihi geçmişte olamaz.");

        var hatim = new Hatim
        {
            Title         = title.Trim(),
            Description   = description?.Trim(),
            CreatorUserId = creatorUserId,
            PlanType      = planType,
            ReadPacing    = readPacing,
            StartDate     = startDate,
            EndDate       = endDate,
            IsPublic      = isPublic,
            CategoryId    = categoryId
        };

        // Private hatim için davet kodu üret
        if (!isPublic)
            hatim.InviteCode = GenerateInviteCode();

        hatim.RaiseDomainEvent(new HatimCreatedEvent(hatim.Id, creatorUserId, planType));
        return hatim;
    }

    // ── Davranış metodları ───────────────────────────────────────

    /// <summary>Hatimi aktif hale getirir; Draft → Active geçişi.</summary>
    public void Activate()
    {
        if (Status != HatimStatus.Draft)
            throw new DomainException($"Sadece Draft hatimler aktif edilebilir. Mevcut durum: {Status}");

        Status = HatimStatus.Active;
        MarkUpdated();
        RaiseDomainEvent(new HatimActivatedEvent(Id));
    }

    /// <summary>
    /// Döngüyü tamamlar: TotalCycles++, CurrentCycle++.
    /// BackgroundWorker bu metodu çağırır.
    /// </summary>
    public void AdvanceCycle()
    {
        if (Status != HatimStatus.Active)
            throw new DomainException("Sadece aktif hatimler döngü ilerletebilir.");

        TotalCycles++;
        CurrentCycle++;
        MarkUpdated();
        RaiseDomainEvent(new HatimCycleAdvancedEvent(Id, CurrentCycle, TotalCycles));
    }

    /// <summary>
    /// Tüm cüzler tamamlandığında hatimi kapatır. Active → Completed geçişi.
    /// </summary>
    public void Complete()
    {
        if (Status != HatimStatus.Active)
            throw new DomainException("Sadece aktif hatimler tamamlanabilir.");

        Status = HatimStatus.Completed;
        TotalCycles++;
        MarkUpdated();
        RaiseDomainEvent(new HatimCompletedEvent(Id, TotalCycles));
    }

    public void Archive()
    {
        if (Status == HatimStatus.Archived)
            throw new DomainException("Hatim zaten arşivlenmiş.");

        Status = HatimStatus.Archived;
        MarkUpdated();
    }

    public void UpdateDetails(string title, string? description, int? categoryId)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Hatim başlığı boş olamaz.");

        Title       = title.Trim();
        Description = description?.Trim();
        CategoryId  = categoryId;
        MarkUpdated();
    }

    /// <summary>Public hatimi private'a çevir veya tersi; InviteCode buna göre yönetilir.</summary>
    public void SetVisibility(bool isPublic)
    {
        IsPublic = isPublic;
        InviteCode = isPublic ? null : (InviteCode ?? GenerateInviteCode());
        MarkUpdated();
    }

    /// <summary>Mevcut InviteCode'u geçersiz kılarak yeni bir tane üretir.</summary>
    public void RegenerateInviteCode()
    {
        if (IsPublic)
            throw new DomainException("Public hatimlerde davet kodu kullanılmaz.");

        InviteCode = GenerateInviteCode();
        MarkUpdated();
    }

    // ── Yardımcı ────────────────────────────────────────────────
    private static string GenerateInviteCode() =>
        Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("/", "_").Replace("+", "-")[..12]
            .ToUpperInvariant();
}
