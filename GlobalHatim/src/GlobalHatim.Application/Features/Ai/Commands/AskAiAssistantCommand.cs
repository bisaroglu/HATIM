using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using MediatR;

namespace GlobalHatim.Application.Features.Ai.Commands;

// ── Request / Response DTO ────────────────────────────────────────────────────

/// <summary>
/// Kullanıcıdan gelen mesajı AI asistanına iletir ve yanıtı döndürür.
/// </summary>
/// <param name="Message">Kullanıcının yazdığı mesaj.</param>
public sealed record AskAiAssistantCommand(string Message) : IRequest<AiAssistantResult>;

/// <summary>
/// AI asistanının ürettiği yanıt.
/// </summary>
/// <param name="Reply">Modelin döndürdüğü metin.</param>
public sealed record AiAssistantResult(string Reply);

// ── Validator ─────────────────────────────────────────────────────────────────

public sealed class AskAiAssistantCommandValidator : AbstractValidator<AskAiAssistantCommand>
{
    private const int MaxMessageLength = 4_000;

    public AskAiAssistantCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Mesaj boş olamaz.")
            .MaximumLength(MaxMessageLength)
            .WithMessage($"Mesaj en fazla {MaxMessageLength} karakter olabilir.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class AskAiAssistantCommandHandler
    : IRequestHandler<AskAiAssistantCommand, AiAssistantResult>
{
    private readonly IAiService _aiService;

    public AskAiAssistantCommandHandler(IAiService aiService)
    {
        _aiService = aiService;
    }

    public async Task<AiAssistantResult> Handle(
        AskAiAssistantCommand request,
        CancellationToken     cancellationToken)
    {
        var reply = await _aiService.GenerateResponseAsync(request.Message, cancellationToken);
        return new AiAssistantResult(reply);
    }
}
