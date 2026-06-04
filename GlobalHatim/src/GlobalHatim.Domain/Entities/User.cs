using GlobalHatim.Domain.Enums;
using GlobalHatim.Domain.Events;
using GlobalHatim.Domain.Exceptions;

namespace GlobalHatim.Domain.Entities;

public sealed class User : BaseEntity
{
    // ── Kimlik ──────────────────────────────────────────────────
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string? AvatarUrl { get; private set; }

    // ── Seviye (Gamification) ───────────────────────────────────
    public Guid? LevelId { get; private set; }
    public UserLevel? Level { get; private set; }

    // ── Durum ───────────────────────────────────────────────────
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset? LastLoginAt { get; private set; }

    // ── İlişkiler ───────────────────────────────────────────────
    public UserStats? Stats { get; private set; }
    public UserSettings? Settings { get; private set; }
    public ICollection<HatimParticipant> Participations { get; private set; } = [];
    public ICollection<JuzAllocation> Allocations { get; private set; } = [];
    public ICollection<ReadingLog> ReadingLogs { get; private set; } = [];

    // ── Hesaplanmış özellik ──────────────────────────────────────
    public string FullName => $"{FirstName} {LastName}";

    // EF Core için parametresiz constructor
    private User() { }

    // ── Factory method — yeni kullanıcı oluşturma ───────────────
    public static User Create(string email, string passwordHash, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("E-posta adresi boş olamaz.");
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Şifre hash'i boş olamaz.");
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("Ad boş olamaz.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Soyad boş olamaz.");

        var user = new User
        {
            Email       = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName   = firstName.Trim(),
            LastName    = lastName.Trim()
        };

        user.RaiseDomainEvent(new UserRegisteredEvent(user.Id, user.Email));
        return user;
    }

    // ── Davranış metodları ───────────────────────────────────────

    public void UpdateProfile(string firstName, string lastName, string? avatarUrl)
    {
        FirstName = string.IsNullOrWhiteSpace(firstName)
            ? throw new DomainException("Ad boş olamaz.")
            : firstName.Trim();

        LastName = string.IsNullOrWhiteSpace(lastName)
            ? throw new DomainException("Soyad boş olamaz.")
            : lastName.Trim();

        AvatarUrl = avatarUrl;
        MarkUpdated();
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }

    public void ChangePasswordHash(string newHash)
    {
        if (string.IsNullOrWhiteSpace(newHash))
            throw new DomainException("Yeni şifre hash'i boş olamaz.");

        PasswordHash = newHash;
        MarkUpdated();
    }

    public void AssignLevel(Guid levelId)
    {
        LevelId = levelId;
        MarkUpdated();
    }
}
