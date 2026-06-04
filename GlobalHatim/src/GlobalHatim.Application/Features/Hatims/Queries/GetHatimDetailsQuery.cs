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
        var hatim = await _db.Hatims
            .AsNoTracking()
            .Include(h => h.Creator)
            .Include(h => h.Category)
            .Include(h => h.Participants)
            .Include(h => h.JuzAllocations.Where(a => a.CycleNumber == h.CurrentCycle))
                .ThenInclude(a => a.AssignedUser)
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new InvalidOperationException("Hatim bulunamadı.");

        var juzSlots = hatim.JuzAllocations
            .OrderBy(a => a.JuzNumber)
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
            CreatorName:       hatim.Creator.FullName,
            CategoryName:      hatim.Category?.NameTr,
            JuzSlots:          juzSlots);
    }
}
