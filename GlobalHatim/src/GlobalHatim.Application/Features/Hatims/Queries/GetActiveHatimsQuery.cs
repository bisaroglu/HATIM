using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Herkese açık (IsPublic=true) ve aktif hatimleri sayfalı döndürür.
/// GET /api/hatims → auth gerektirmez.
/// </summary>
public sealed record GetActiveHatimsQuery(
    int Page     = 1,
    int PageSize = 20
) : IRequest<GetActiveHatimsResult>;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public sealed record HatimSummaryDto(
    Guid      Id,
    string    Title,
    string?   Description,
    string    PlanType,
    DateOnly  StartDate,
    DateOnly? EndDate,
    int       CurrentCycle,
    int       TotalParticipants,
    int       CompletedJuz,
    int       TotalJuz,
    string?   CategoryName,
    DateTimeOffset CreatedAt
);

public sealed record GetActiveHatimsResult(
    IReadOnlyList<HatimSummaryDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetActiveHatimsQueryHandler : IRequestHandler<GetActiveHatimsQuery, GetActiveHatimsResult>
{
    private readonly IApplicationDbContext _db;

    public GetActiveHatimsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<GetActiveHatimsResult> Handle(
        GetActiveHatimsQuery request,
        CancellationToken    cancellationToken)
    {
        var baseQuery = _db.Hatims
            .AsNoTracking()
            .Where(h => h.IsPublic && h.Status == HatimStatus.Active);

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var hatims = await baseQuery
            .Include(h => h.Category)
            .Include(h => h.Participants)
            .Include(h => h.JuzAllocations)
            .OrderByDescending(h => h.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = hatims.Select(h => new HatimSummaryDto(
            Id:                h.Id,
            Title:             h.Title,
            Description:       h.Description,
            PlanType:          h.PlanType.ToString(),
            StartDate:         h.StartDate,
            EndDate:           h.EndDate,
            CurrentCycle:      h.CurrentCycle,
            TotalParticipants: h.Participants.Count,
            CompletedJuz:      h.JuzAllocations.Count(a =>
                                   a.CycleNumber == h.CurrentCycle &&
                                   a.Status == JuzAllocationStatus.Completed),
            TotalJuz:          30,
            CategoryName:      h.Category?.NameTr,
            CreatedAt:         h.CreatedAt
        )).ToList();

        return new GetActiveHatimsResult(items, totalCount, request.Page, request.PageSize);
    }
}
