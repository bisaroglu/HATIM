using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.JuzAllocations.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Boştaki (Available) bir cüzü kullanıcı veya misafire atar (Assigned).
///
/// Akış:
///   1. Hatim aktif mi? Belirtilen cüz Available mi?
///   2. Kayıtlı kullanıcı → AssignToUser()
///      Misafir           → IGuestTokenService ile token üret → AssignToGuest()
///   3. SaveChangesAsync
/// </summary>
public sealed record AllocateJuzCommand(
    Guid    HatimId,
    int     JuzNumber,
    // Kayıtlı kullanıcı alanları
    Guid?   UserId,
    // Misafir alanları (UserId null ise zorunlu)
    string? GuestFirstName,
    string? GuestLastName
) : IRequest<AllocateJuzResult>;

public sealed record AllocateJuzResult(
    Guid   AllocationId,
    Guid   HatimId,
    int    JuzNumber,
    string AssigneeName,
    /// <summary>Yalnızca misafir atamasında dolu gelir; client'ın güvenli saklaması gerekir.</summary>
    string? GuestToken
);

// ── Validator ─────────────────────────────────────────────────────────────────

public sealed class AllocateJuzCommandValidator : AbstractValidator<AllocateJuzCommand>
{
    public AllocateJuzCommandValidator()
    {
        RuleFor(x => x.HatimId)
            .NotEmpty().WithMessage("HatimId boş olamaz.");

        RuleFor(x => x.JuzNumber)
            .InclusiveBetween(1, 30).WithMessage("Cüz numarası 1-30 arasında olmalıdır.");

        // UserId yoksa misafir alanları zorunlu
        When(x => !x.UserId.HasValue, () =>
        {
            RuleFor(x => x.GuestFirstName)
                .NotEmpty().WithMessage("Misafir adı zorunludur.");
            RuleFor(x => x.GuestLastName)
                .NotEmpty().WithMessage("Misafir soyadı zorunludur.");
        });

        // Her ikisi birden doluysa hata
        RuleFor(x => x)
            .Must(x => !(x.UserId.HasValue && !string.IsNullOrWhiteSpace(x.GuestFirstName)))
            .WithMessage("UserId ve GuestFirstName aynı anda sağlanamaz.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class AllocateJuzCommandHandler : IRequestHandler<AllocateJuzCommand, AllocateJuzResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IGuestTokenService    _guestTokenService;

    public AllocateJuzCommandHandler(IApplicationDbContext db, IGuestTokenService guestTokenService)
    {
        _db                = db;
        _guestTokenService = guestTokenService;
    }

    public async Task<AllocateJuzResult> Handle(
        AllocateJuzCommand request,
        CancellationToken  cancellationToken)
    {
        // ── 1. Hatim kontrolü ────────────────────────────────────────────────
        var hatim = await _db.Hatims
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new InvalidOperationException("Hatim bulunamadı.");

        if (hatim.Status != Domain.Enums.HatimStatus.Active)
            throw new InvalidOperationException("Yalnızca aktif hatimlere cüz atanabilir.");

        // ── 2. Allocation kontrolü ───────────────────────────────────────────
        var allocation = await _db.JuzAllocations
            .FirstOrDefaultAsync(
                a => a.HatimId     == request.HatimId
                  && a.JuzNumber   == request.JuzNumber
                  && a.CycleNumber == hatim.CurrentCycle,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"Cüz {request.JuzNumber} bu hatimde bulunamadı.");

        if (allocation.Status != JuzAllocationStatus.Available)
            throw new InvalidOperationException(
                $"Cüz {request.JuzNumber} şu anda müsait değil. Mevcut durum: {allocation.Status}");

        // ── 3. Deadline hesapla (PlanType'a göre basit kural) ────────────────
        var deadline = hatim.PlanType switch
        {
            PlanType.WeeklyNoAccel  => DateTimeOffset.UtcNow.AddDays(7),
            PlanType.LongTermHybrid => DateTimeOffset.UtcNow.AddDays(14),
            _                        => DateTimeOffset.UtcNow.AddDays(3)
        };

        // ── 4. Atama ─────────────────────────────────────────────────────────
        string? guestToken = null;

        if (request.UserId.HasValue)
        {
            // Kayıtlı kullanıcı var mı?
            var userExists = await _db.Users
                .AnyAsync(u => u.Id == request.UserId.Value && u.IsActive, cancellationToken);

            if (!userExists)
                throw new InvalidOperationException("Kullanıcı bulunamadı veya pasif.");

            allocation.AssignToUser(request.UserId.Value, deadline);
        }
        else
        {
            // Misafir: kriptografik token üret ve Redis'e yaz
            guestToken = await _guestTokenService.GenerateAsync(allocation.Id, cancellationToken);

            allocation.AssignToGuest(
                request.GuestFirstName!,
                request.GuestLastName!,
                guestToken,
                deadline);
        }

        // ── 5. Kaydet ────────────────────────────────────────────────────────
        await _db.SaveChangesAsync(cancellationToken);

        return new AllocateJuzResult(
            AllocationId:  allocation.Id,
            HatimId:       allocation.HatimId,
            JuzNumber:     allocation.JuzNumber,
            AssigneeName:  allocation.AssigneeName,
            GuestToken:    guestToken);
    }
}
