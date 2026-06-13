using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using MediatR;

namespace GlobalHatim.Application.Features.ContactMessages.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Ziyaretçi veya kullanıcıdan gelen geri bildirim / iletişim mesajını kaydeder.
/// </summary>
public sealed record SendContactMessageCommand(
    string  Name,
    string? EmailOrPhone,
    string  Message
) : IRequest<SendContactMessageResult>;

public sealed record SendContactMessageResult(Guid MessageId);

// ── Validator ────────────────────────────────────────────────────────────────

public sealed class SendContactMessageCommandValidator
    : AbstractValidator<SendContactMessageCommand>
{
    public SendContactMessageCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ad Soyad boş olamaz.")
            .MaximumLength(150).WithMessage("Ad Soyad en fazla 150 karakter olabilir.");

        RuleFor(x => x.EmailOrPhone)
            .MaximumLength(150).WithMessage("E-posta / telefon en fazla 150 karakter olabilir.")
            .When(x => x.EmailOrPhone is not null);

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Mesaj boş olamaz.")
            .MinimumLength(10).WithMessage("Mesaj en az 10 karakter olmalıdır.")
            .MaximumLength(2000).WithMessage("Mesaj en fazla 2000 karakter olabilir.");
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

public sealed class SendContactMessageCommandHandler
    : IRequestHandler<SendContactMessageCommand, SendContactMessageResult>
{
    private readonly IApplicationDbContext _db;

    public SendContactMessageCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<SendContactMessageResult> Handle(
        SendContactMessageCommand request,
        CancellationToken         cancellationToken)
    {
        var message = ContactMessage.Create(
            name:         request.Name,
            emailOrPhone: request.EmailOrPhone,
            message:      request.Message);

        _db.ContactMessages.Add(message);
        await _db.SaveChangesAsync(cancellationToken);

        return new SendContactMessageResult(message.Id);
    }
}
