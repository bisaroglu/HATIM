using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Users.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Kullanicinin aktif cuz taahhutlerini (status = Assigned) dondurur.
/// Her taahhudun ait oldugu hatim bilgisi de eklenir.
/// GET /api/users/{userId}/allocations
/// </summary>
public sealed record GetMyAllocationsQuery(Guid UserId) : IRequest<IReadOnlyList<UserAllocationDto>>;

// ── DTO ───────────────────────────────────────────────────────────────────────

public sealed record UserAllocationDto(
    Guid            AllocationId,
    Guid            HatimId,
    string          HatimTitle,
    string          CreatorName,
    /// <summary>"Fixed" | "Cyclic" | "Daily" | "Weekly"</summary>
    string          PlanType,
    int             JuzNumber,
    int             CycleNumber,
    int             CompletedJuzInHatim,   // Bu donguде tamamlanan cuz sayisi
    int             TotalJuz,              // Her zaman 30
    DateTimeOffset  AssignedAt,
    DateTimeOffset? DeadlineAt
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetMyAllocationsQueryHandler
    : IRequestHandler<GetMyAllocationsQuery, IReadOnlyList<UserAllocationDto>>
{
    private readonly IApplicationDbContext _db;

    public GetMyAllocationsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<UserAllocationDto>> Handle(
        GetMyAllocationsQuery request,
        CancellationToken     cancellationToken)
    {
        // 1. Kullanicinin Assigned durumundaki cuz atamalarini getir.
        //    ThenInclude(h => h.JuzAllocations) KALDIRILDI:
        //    JuzAllocation -> Hatim -> JuzAllocations -> JuzAllocation dongusu
        //    AsNoTracking ile EF Core 8'de cycle hatasina yol acar.
        var allocations = await _db.JuzAllocations
            .AsNoTracking()
            .Where(a => a.AssignedUserId == request.UserId
                     && a.Status == JuzAllocationStatus.Assigned)
            .Include(a => a.Hatim)
                .ThenInclude(h => h.Creator)
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync(cancellationToken);

        if (allocations.Count == 0)
            return Array.Empty<UserAllocationDto>();

        // 2. Bu hatimlerdeki tamamlanan cuz sayilarini ayri sorguyla cek.
        //    Include yerine dogrudan scalar gruplama — cycle yok.
        var hatimIds      = allocations.Select(a => a.HatimId).Distinct().ToList();
        var currentCycles = allocations
            .GroupBy(a => a.HatimId)
            .ToDictionary(g => g.Key, g => g.First().Hatim.CurrentCycle);

        // Her hatim icin (hatimId, cycleNumber) ciftindeki Completed cuz sayisi
        var completedCounts = (await _db.JuzAllocations
            .AsNoTracking()
            .Where(j => hatimIds.Contains(j.HatimId)
                     && j.Status == JuzAllocationStatus.Completed)
            .Select(j => new { j.HatimId, j.CycleNumber })
            .ToListAsync(cancellationToken))
            .Where(j => currentCycles.TryGetValue(j.HatimId, out var c) && j.CycleNumber == c)
            .GroupBy(j => j.HatimId)
            .ToDictionary(g => g.Key, g => g.Count());

        // 3. DTO eslestirme
        return allocations.Select(a => new UserAllocationDto(
            AllocationId:        a.Id,
            HatimId:             a.HatimId,
            HatimTitle:          a.Hatim.Title,
            CreatorName:         a.Hatim.Creator.FullName,
            PlanType:            a.Hatim.PlanType.ToString(),
            JuzNumber:           a.JuzNumber,
            CycleNumber:         a.CycleNumber,
            CompletedJuzInHatim: completedCounts.GetValueOrDefault(a.HatimId, 0),
            TotalJuz:            30,
            AssignedAt:          a.AssignedAt!.Value,
            DeadlineAt:          a.DeadlineAt
        )).ToList();
    }
}
