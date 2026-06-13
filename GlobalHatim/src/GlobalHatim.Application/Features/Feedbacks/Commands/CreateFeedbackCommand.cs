using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using MediatR;

namespace GlobalHatim.Application.Features.Feedbacks.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Anonim veya giriş yapmış kullanıcıdan geri bildirim kaydeder.
/// POST /api/feedbacks — [AllowAnonymous]
/// </summary>
public sealed record CreateFeedbackCommand(
    string  Name,
    string? Email,
    string  Message,
    Guid?   UserId = null
) : IRequest<CreateFeedbackResult>;

public sealed record CreateFeedbackResult(Guid FeedbackId);

// ── Validator ────────────────────────────────────────────────────────────────

public sealed class CreateFeedbackCommandValidator : AbstractValidator<CreateFeedbackCommand>
{
    public CreateFeedbackCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ad Soyad boş olamaz.")
            .MaximumLength(150).WithMessage("Ad Soyad en fazla 150 karakter olabilir.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi girin.")
            .MaximumLength(255).WithMessage("E-posta en fazla 255 karakter olabilir.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Mesaj boş olamaz.")
            .MinimumLength(10).WithMessage("Mesaj en az 10 karakter olmalıdır.")
            .MaximumLength(2000).WithMessage("Mesaj en fazla 2000 karakter olabilir.");
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

public sealed class CreateFeedbackCommandHandler
    : IRequestHandler<CreateFeedbackCommand, CreateFeedbackResult>
{
    private readonly IApplicationDbContext _db;

    public CreateFeedbackCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<CreateFeedbackResult> Handle(
        CreateFeedbackCommand request,
        CancellationToken     cancellationToken)
    {
        var feedback = Feedback.Create(
            name:    request.Name,
            message: request.Message,
            email:   request.Email,
            userId:  request.UserId);

        _db.Feedbacks.Add(feedback);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateFeedbackResult(feedback.Id);
    }
}
