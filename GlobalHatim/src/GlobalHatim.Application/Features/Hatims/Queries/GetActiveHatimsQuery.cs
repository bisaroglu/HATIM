using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Herkese acik (IsPublic=true) ve aktif hatimleri sayfali dondurur.
/// GET /api/hatims → auth gerektirmez.
/// </summary>
public sealed record GetActiveHatimsQuery(
    int     Page       = 1,
    int     PageSize   = 20,
    string? SearchTerm = null
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

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var lowerTerm = request.SearchTerm.Trim().ToLower();
            baseQuery = baseQuery.Where(h =>
                h.Title.ToLower().Contains(lowerTerm) ||
                (h.Description != null && h.Description.ToLower().Contains(lowerTerm)));
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        // 1. Hatimleri yukle — Include(h => h.JuzAllocations) KALDIRILDI.
        //    Hatim -> JuzAllocations -> JuzAllocation.Hatim -> Hatim dongusu
        //    AsNoTracking ile EF Core 8'de cycle hatasina yol acar.
        var hatims = await baseQuery
            .Include(h => h.Category)
            .Include(h => h.Participants)
            .OrderByDescending(h => h.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (hatims.Count == 0)
            return new GetActiveHatimsResult(Array.Empty<HatimSummaryDto>(), totalCount, request.Page, request.PageSize);

        // 2. Her hatim icin alinmis cuz sayisini ayri sorguyla cek.
        //    Status != Available → hem Assigned hem Completed sayilir (alinmis cuz = ilerleme).
        var hatimIds      = hatims.Select(h => h.Id).ToList();
        var cycleByHatim  = hatims.ToDictionary(h => h.Id, h => h.CurrentCycle);

        var takenCounts = (await _db.JuzAllocations
            .AsNoTracking()
            .Where(a => hatimIds.Contains(a.HatimId)
                     && a.Status != JuzAllocationStatus.Available)
            .Select(a => new { a.HatimId, a.CycleNumber })
            .ToListAsync(cancellationToken))
            .Where(a => cycleByHatim.TryGetValue(a.HatimId, out var c) && a.CycleNumber == c)
            .GroupBy(a => a.HatimId)
            .ToDictionary(g => g.Key, g => g.Count());

        // 3. DTO eslestirme
        var items = hatims.Select(h => new HatimSummaryDto(
            Id:                h.Id,
            Title:             h.Title,
            Description:       h.Description,
            PlanType:          h.PlanType.ToString(),
            StartDate:         h.StartDate,
            EndDate:           h.EndDate,
            CurrentCycle:      h.CurrentCycle,
            TotalParticipants: h.Participants.Count,
            CompletedJuz:      takenCounts.GetValueOrDefault(h.Id, 0),
            TotalJuz:          30,
            CategoryName:      h.Category?.NameTr,
            CreatedAt:         h.CreatedAt
        )).ToList();

        return new GetActiveHatimsResult(items, totalCount, request.Page, request.PageSize);
    }
}
