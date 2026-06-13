using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Belirli bir hatimde mevcut döngüde henüz kimseye atanmamış (Available) cüzlerin
/// numaralarını döndürür. JoinHatimModal'ın cüz seçim ekranını beslemek için kullanılır.
///
/// GET /api/hatims/{id}/available-juzs
/// </summary>
public sealed record GetAvailableJuzsQuery(Guid HatimId) : IRequest<AvailableJuzsDto>;

// ── DTO ───────────────────────────────────────────────────────────────────────

public sealed record AvailableJuzsDto(
    Guid               HatimId,
    int                CycleNumber,
    IReadOnlyList<int> AvailableJuzNumbers
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetAvailableJuzsQueryHandler
    : IRequestHandler<GetAvailableJuzsQuery, AvailableJuzsDto>
{
    private readonly IApplicationDbContext _db;

    public GetAvailableJuzsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<AvailableJuzsDto> Handle(
        GetAvailableJuzsQuery request,
        CancellationToken     cancellationToken)
    {
        var hatim = await _db.Hatims
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new KeyNotFoundException("Hatim bulunamadı.");

        var availableJuzNumbers = await _db.JuzAllocations
            .AsNoTracking()
            .Where(a => a.HatimId     == request.HatimId
                     && a.CycleNumber == hatim.CurrentCycle
                     && a.Status      == JuzAllocationStatus.Available)
            .OrderBy(a => a.JuzNumber)
            .Select(a => a.JuzNumber)
            .ToListAsync(cancellationToken);

        return new AvailableJuzsDto(
            HatimId:             request.HatimId,
            CycleNumber:         hatim.CurrentCycle,
            AvailableJuzNumbers: availableJuzNumbers
        );
    }
}
