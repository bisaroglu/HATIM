using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Yeni bir hatim grubu oluşturur.
/// Private hatimde InviteCode domain katmanında otomatik üretilir.
/// Ardından 30 adet JuzAllocation kaydı AVAILABLE durumunda eklenir.
/// </summary>
public sealed record CreateHatimCommand(
    string      Title,
    string?     Description,
    Guid        CreatorUserId,
    PlanType    PlanType,
    ReadPacing  ReadPacing,
    DateOnly    StartDate,
    bool        IsPublic,
    int?        CategoryId,
    DateOnly?   EndDate
) : IRequest<CreateHatimResult>;

public sealed record CreateHatimResult(
    Guid   HatimId,
    string Title,
    bool   IsPublic,
    string? InviteCode
);

// ── Validator ────────────────────────────────────────────────────────────────

public sealed class CreateHatimCommandValidator : AbstractValidator<CreateHatimCommand>
{
    public CreateHatimCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Hatim başlığı boş olamaz.")
            .MaximumLength(255).WithMessage("Başlık 255 karakteri geçemez.");

        RuleFor(x => x.CreatorUserId)
            .NotEmpty().WithMessage("Oluşturan kullanıcı ID'si gereklidir.");

        RuleFor(x => x.PlanType)
            .IsInEnum().WithMessage("Geçersiz plan tipi.");

        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.Date))
            .WithMessage("Başlangıç tarihi geçmişte olamaz.");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .When(x => x.EndDate.HasValue)
            .WithMessage("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

public sealed class CreateHatimCommandHandler
    : IRequestHandler<CreateHatimCommand, CreateHatimResult>
{
    private readonly IApplicationDbContext _db;

    public CreateHatimCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<CreateHatimResult> Handle(
        CreateHatimCommand request,
        CancellationToken  cancellationToken)
    {
        // 1. Kullanıcı var mı?
        var userExists = await _db.Users
            .AnyAsync(u => u.Id == request.CreatorUserId && u.IsActive, cancellationToken);

        if (!userExists)
            throw new InvalidOperationException("Kullanıcı bulunamadı veya aktif değil.");

        // 2. Hatim entity'sini oluştur (private ise InviteCode domain'de otomatik üretilir)
        var hatim = Hatim.Create(
            title:         request.Title,
            description:   request.Description,
            creatorUserId: request.CreatorUserId,
            planType:      request.PlanType,
            readPacing:    request.ReadPacing,
            startDate:     request.StartDate,
            isPublic:      request.IsPublic,
            categoryId:    request.CategoryId,
            endDate:       request.EndDate);

        _db.Hatims.Add(hatim);

        // 3. Oluşturan kullanıcıyı Manager rolüyle katılımcı ekle
        var managerParticipant = HatimParticipant.Create(
            hatim.Id, request.CreatorUserId, ParticipantRole.Manager);

        _db.HatimParticipants.Add(managerParticipant);

        // 4. 30 cüzün tamamı için AVAILABLE JuzAllocation kayıtları oluştur
        //    Döngülü hatimlerde cycle_number = 1; ilerleyen döngüler
        //    BackgroundWorker tarafından yeni kayıtlar eklenerek yönetilir.
        var allocations = Enumerable.Range(1, 30)
            .Select(juzNumber => JuzAllocation.CreateAvailable(
                hatimId:     hatim.Id,
                juzNumber:   juzNumber,
                cycleNumber: 1))
            .ToList();

        await _db.JuzAllocations.AddRangeAsync(allocations, cancellationToken);

        // 5. UserStats: oluşturulan hatim sayısını artır
        var stats = await _db.UserStats
            .FirstOrDefaultAsync(s => s.UserId == request.CreatorUserId, cancellationToken);

        if (stats is null)
        {
            stats = UserStats.CreateForUser(request.CreatorUserId);
            _db.UserStats.Add(stats);
        }

        stats.IncrementHatimsCreated();

        // 6. Tek transaction'da kaydet
        await _db.SaveChangesAsync(cancellationToken);

        // 7. Hatim aktif edilebilir durumda (başlangıç tarihi bugünse hemen aktif et)
        if (hatim.StartDate <= DateOnly.FromDateTime(DateTime.UtcNow.Date))
        {
            hatim.Activate();
            await _db.SaveChangesAsync(cancellationToken);
        }

        return new CreateHatimResult(
            HatimId:    hatim.Id,
            Title:      hatim.Title,
            IsPublic:   hatim.IsPublic,
            InviteCode: hatim.InviteCode);
    }
}
