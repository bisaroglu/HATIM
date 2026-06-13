using GlobalHatim.Domain.Exceptions;

namespace GlobalHatim.Domain.Entities;

/// <summary>
/// Kullanıcı geri bildirimi — anonim veya kayıtlı kullanıcıdan gelebilir.
/// ContactMessage'dan ayrı tutulur: bu tablo frontend'in "Geri Bildirim" formunu besler.
/// </summary>
public sealed class Feedback : BaseEntity
{
    public string  Name    { get; private set; } = default!;
    public string? Email   { get; private set; }
    public string  Message { get; private set; } = default!;

    /// <summary>Giriş yapmış kullanıcıya bağlantı (opsiyonel).</summary>
    public Guid? UserId { get; private set; }

    public bool IsRead    { get; set; } = false;
    public bool IsReplied { get; set; } = false;

    private Feedback() { }

    public static Feedback Create(string name, string message, string? email = null, Guid? userId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Ad Soyad boş olamaz.");
        if (string.IsNullOrWhiteSpace(message))
            throw new DomainException("Mesaj boş olamaz.");

        return new Feedback
        {
            Name    = name.Trim(),
            Message = message.Trim(),
            Email   = email?.Trim(),
            UserId  = userId,
        };
    }
}
