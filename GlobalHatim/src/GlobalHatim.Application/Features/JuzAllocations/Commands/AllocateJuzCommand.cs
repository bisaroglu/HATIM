using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.JuzAllocations.Commands;

// -- Command ------------------------------------------------------------------

/// <summary>
/// Bostaki (Available) bir cüzü kullanici veya misafire atar (Assigned).
///
/// Akis:
///   1. Hatim aktif mi? Belirtilen cüz Available mi?
///   2. Kayitli kullanici -> AssignToUser()
///      Misafir           -> IGuestTokenService ile token üret -> AssignToGuest()
///      Vekaleten (Proxy) -> IGuestTokenService ile token üret -> AssignToProxy()
///   3. SaveChangesAsync
/// </summary>
public sealed record AllocateJuzCommand(
    Guid    HatimId,
    int     JuzNumber,
    // Kayitli kullanici alanlari
    Guid?   UserId,
    // Misafir alanlari (UserId null ise zorunlu)
    string? GuestFirstName,
    string? GuestLastName,
    // Vekaleten atama: Hatim sahibi baskasi adina cüz alir
    string? ProxyName = null
) : IRequest<AllocateJuzResult>;

public sealed record AllocateJuzResult(
    Guid   AllocationId,
    Guid   HatimId,
    int    JuzNumber,
    string AssigneeName,
    /// <summary>Yalnizca misafir atamasinda dolu gelir; client'in güvenli saklamasi gerekir.</summary>
    string? GuestToken
);

// -- Validator ----------------------------------------------------------------

public sealed class AllocateJuzCommandValidator : AbstractValidator<AllocateJuzCommand>
{
    public AllocateJuzCommandValidator()
    {
        RuleFor(x => x.HatimId)
            .NotEmpty().WithMessage("HatimId bos olamaz.");

        RuleFor(x => x.JuzNumber)
            .InclusiveBetween(1, 30).WithMessage("Cüz numarasi 1-30 arasinda olmalidir.");

        // UserId yoksa ve ProxyName de yoksa -> misafir akisi: en az GuestFirstName zorunlu
        // GuestLastName opsiyonel; tek isim yeterliyse bos birakilabilir
        When(x => !x.UserId.HasValue && string.IsNullOrWhiteSpace(x.ProxyName), () =>
        {
            RuleFor(x => x.GuestFirstName)
                .NotEmpty().WithMessage("Misafir adi zorunludur.");
        });

        // UserId var + GuestFirstName var + ProxyName yok -> hata
        RuleFor(x => x)
            .Must(x => !(x.UserId.HasValue
                         && !string.IsNullOrWhiteSpace(x.GuestFirstName)
                         && string.IsNullOrWhiteSpace(x.ProxyName)))
            .WithMessage("UserId ve GuestFirstName ayni anda saglanamaz (ProxyName kullanin).");
    }
}

// -- Handler ------------------------------------------------------------------

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
        // -- 1. Hatim kontrolü -----------------------------------------------
        var hatim = await _db.Hatims
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new InvalidOperationException("Hatim bulunamadi.");

        if (hatim.Status != Domain.Enums.HatimStatus.Active)
            throw new InvalidOperationException("Yalnizca aktif hatimlere cüz atanabilir.");

        // -- 2. Allocation kontrolü ------------------------------------------
        var allocation = await _db.JuzAllocations
            .FirstOrDefaultAsync(
                a => a.HatimId     == request.HatimId
                  && a.JuzNumber   == request.JuzNumber
                  && a.CycleNumber == hatim.CurrentCycle,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"Cüz {request.JuzNumber} bu hatimde bulunamadi.");

        if (allocation.Status != JuzAllocationStatus.Available)
            throw new InvalidOperationException(
                $"Cüz {request.JuzNumber} su anda müsait degil. Mevcut durum: {allocation.Status}");

        // -- 3. Deadline hesapla — ReadPacing'e göre kesin kural ------------
        var deadline = hatim.ReadPacing switch
        {
            ReadPacing.Daily1Juz      => DateTimeOffset.UtcNow.AddDays(1),
            ReadPacing.Every2Days1Juz => DateTimeOffset.UtcNow.AddDays(2),
            ReadPacing.Every4Days1Juz => DateTimeOffset.UtcNow.AddDays(4),
            _                          => DateTimeOffset.UtcNow.AddDays(7)
        };

        // -- 4. Atama --------------------------------------------------------
        string? guestToken = null;

        if (!string.IsNullOrWhiteSpace(request.ProxyName))
        {
            // Vekaleten atama: Hatim sahibi baskasi adina cüz aliyor.
            // UserId kaydedilmez; cüz grid'inde ProxyName gösterilir.
            guestToken = await _guestTokenService.GenerateAsync(allocation.Id, cancellationToken);
            allocation.AssignToProxy(request.ProxyName, guestToken, deadline);
        }
        else if (request.UserId.HasValue)
        {
            // Kayitli kullanici
            var userExists = await _db.Users
                .AnyAsync(u => u.Id == request.UserId.Value && u.IsActive, cancellationToken);

            if (!userExists)
                throw new InvalidOperationException("Kullanici bulunamadi veya pasif.");

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

        // -- 5. Kaydet -------------------------------------------------------
        await _db.SaveChangesAsync(cancellationToken);

        return new AllocateJuzResult(
            AllocationId:  allocation.Id,
            HatimId:       allocation.HatimId,
            JuzNumber:     allocation.JuzNumber,
            AssigneeName:  allocation.AssigneeName,
            GuestToken:    guestToken);
    }
}
