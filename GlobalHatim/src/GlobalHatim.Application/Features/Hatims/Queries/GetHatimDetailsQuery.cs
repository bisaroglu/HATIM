using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Belirli bir hatimin detayını ve 30 cüzün anlık durumunu döndürür.
/// Arayüzdeki cüz butonlarını beslemek için kullanılır.
/// GET /api/hatims/{id}
/// </summary>
public sealed record GetHatimDetailsQuery(Guid HatimId) : IRequest<HatimDetailsDto>;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public sealed record JuzSlotDto(
    Guid   AllocationId,
    int    JuzNumber,
    string Status,        // Available | Assigned | Completed
    string AssigneeName,  // "—" eğer boşta
    bool   IsAssignedToGuest,
    DateTimeOffset? AssignedAt,
    DateTimeOffset? DeadlineAt,
    DateTimeOffset? CompletedAt
);

public sealed record HatimDetailsDto(
    Guid      Id,
    string    Title,
    string?   Description,
    string    PlanType,
    string    Status,
    bool      IsPublic,
    DateOnly  StartDate,
    DateOnly? EndDate,
    int       CurrentCycle,
    int       TotalCycles,
    int       TotalParticipants,
    Guid      CreatorId,
    string    CreatorName,
    string?   CategoryName,
    IReadOnlyList<JuzSlotDto> JuzSlots
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetHatimDetailsQueryHandler : IRequestHandler<GetHatimDetailsQuery, HatimDetailsDto>
{
    private readonly IApplicationDbContext _db;

    public GetHatimDetailsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<HatimDetailsDto> Handle(
        GetHatimDetailsQuery request,
        CancellationToken    cancellationToken)
    {
        // ── 1. Hatim + ilişkili meta veriler (JuzAllocations yok) ────────────
        // Filtered Include içinde "h.CurrentCycle" gibi üst entity özelliği
        // kullanılamaz; EF Core bunu SQL'e çeviremez.
        // Çözüm: önce hatimi yükle → CurrentCycle'ı sabit değer olarak al →
        //        ardından JuzAllocations'ı ayrı sorguda çek.
        var hatim = await _db.Hatims
            .AsNoTracking()
            .Include(h => h.Creator)
            .Include(h => h.Category)
            .Include(h => h.Participants)
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new InvalidOperationException("Hatim bulunamadı.");

        // ── 2. Mevcut döngüdeki cüzleri ayrı sorguyla çek ───────────────────
        // Sabit değer (hatim.CurrentCycle) kullanıldığı için EF Core tam
        // olarak SQL'e çevirebilir; AssignedUser'ı da tek JOIN ile alır.
        var currentCycle = hatim.CurrentCycle;

        var rawAllocations = await _db.JuzAllocations
            .AsNoTracking()
            .Include(a => a.AssignedUser)
            .Where(a => a.HatimId     == request.HatimId
                     && a.CycleNumber == currentCycle)
            .OrderBy(a => a.JuzNumber)
            .ToListAsync(cancellationToken);

        // ── 3. DTO dönüşümü — bellek üzerinde, EF çeviri riski yok ─────────
        var juzSlots = rawAllocations
            .Select(a => new JuzSlotDto(
                AllocationId:      a.Id,
                JuzNumber:         a.JuzNumber,
                Status:            a.Status.ToString(),
                AssigneeName:      a.AssigneeName,
                IsAssignedToGuest: a.IsAssignedToGuest,
                AssignedAt:        a.AssignedAt,
                DeadlineAt:        a.DeadlineAt,
                CompletedAt:       a.CompletedAt
            ))
            .ToList();

        return new HatimDetailsDto(
            Id:                hatim.Id,
            Title:             hatim.Title,
            Description:       hatim.Description,
            PlanType:          hatim.PlanType.ToString(),
            Status:            hatim.Status.ToString(),
            IsPublic:          hatim.IsPublic,
            StartDate:         hatim.StartDate,
            EndDate:           hatim.EndDate,
            CurrentCycle:      hatim.CurrentCycle,
            TotalCycles:       hatim.TotalCycles,
            TotalParticipants: hatim.Participants.Count,
            CreatorId:         hatim.CreatorUserId,
            CreatorName:       hatim.Creator.FullName,
            CategoryName:      hatim.Category?.NameTr,
            JuzSlots:          juzSlots);
    }
}
