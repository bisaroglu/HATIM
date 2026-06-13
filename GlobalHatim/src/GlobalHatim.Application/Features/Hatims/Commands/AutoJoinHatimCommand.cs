using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Application.Features.JuzAllocations.Commands;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Kullanıcıyı aktif bir hatim'e otomatik olarak ekler:
/// Mevcut döngüdeki ilk Available JuzAllocation'ı bulur ve
/// kullanıcıya veya misafire atar.
///
/// POST /api/Hatims/{hatimId}/join
/// </summary>
public sealed record AutoJoinHatimCommand(
    Guid    HatimId,
    Guid?   UserId,
    string? GuestFirstName,
    string? GuestLastName
) : IRequest<AllocateJuzResult>;

// ── Validator ────────────────────────────────────────────────────────────────

public sealed class AutoJoinHatimCommandValidator : AbstractValidator<AutoJoinHatimCommand>
{
    public AutoJoinHatimCommandValidator()
    {
        RuleFor(x => x.HatimId)
            .NotEmpty().WithMessage("HatimId boş olamaz.");

        // UserId yoksa misafir alanları zorunlu
        When(x => !x.UserId.HasValue, () =>
        {
            RuleFor(x => x.GuestFirstName)
                .NotEmpty().WithMessage("Misafir adı zorunludur.");
            RuleFor(x => x.GuestLastName)
                .NotEmpty().WithMessage("Misafir soyadı zorunludur.");
        });

        // Her ikisi birden gönderilemez
        RuleFor(x => x)
            .Must(x => !(x.UserId.HasValue && !string.IsNullOrWhiteSpace(x.GuestFirstName)))
            .WithMessage("UserId ve GuestFirstName aynı anda sağlanamaz.");
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

public sealed class AutoJoinHatimCommandHandler
    : IRequestHandler<AutoJoinHatimCommand, AllocateJuzResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IMediator             _mediator;

    public AutoJoinHatimCommandHandler(IApplicationDbContext db, IMediator mediator)
    {
        _db       = db;
        _mediator = mediator;
    }

    public async Task<AllocateJuzResult> Handle(
        AutoJoinHatimCommand request,
        CancellationToken    cancellationToken)
    {
        // ── 1. Hatim aktif mi? ───────────────────────────────────────────────
        var hatim = await _db.Hatims
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new KeyNotFoundException("Hatim bulunamadı.");

        if (hatim.Status != HatimStatus.Active)
            throw new InvalidOperationException("Bu hatim şu anda aktif değil, katılım alınmıyor.");

        // ── 2. Kullanıcı zaten katılmış mı? ─────────────────────────────────
        if (request.UserId.HasValue)
        {
            var alreadyAssigned = await _db.JuzAllocations
                .AnyAsync(a => a.HatimId       == request.HatimId
                            && a.AssignedUserId == request.UserId.Value
                            && a.CycleNumber    == hatim.CurrentCycle
                            && a.Status         != JuzAllocationStatus.Completed,
                          cancellationToken);

            if (alreadyAssigned)
                throw new InvalidOperationException("Bu hatimde zaten aktif bir cüz taahhüdünüz bulunuyor.");
        }

        // ── 3. İlk boş (Available) cüzü bul ────────────────────────────────
        var firstAvailable = await _db.JuzAllocations
            .Where(a => a.HatimId     == request.HatimId
                     && a.CycleNumber == hatim.CurrentCycle
                     && a.Status      == JuzAllocationStatus.Available)
            .OrderBy(a => a.JuzNumber)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException(
                "Bu hatimde şu an boş cüz bulunmuyor. Tüm cüzler dağıtılmış olabilir.");

        // ── 4. AllocateJuzCommand'ı dispatch et ─────────────────────────────
        return await _mediator.Send(new AllocateJuzCommand(
            HatimId:        request.HatimId,
            JuzNumber:      firstAvailable.JuzNumber,
            UserId:         request.UserId,
            GuestFirstName: request.GuestFirstName,
            GuestLastName:  request.GuestLastName
        ), cancellationToken);
    }
}
