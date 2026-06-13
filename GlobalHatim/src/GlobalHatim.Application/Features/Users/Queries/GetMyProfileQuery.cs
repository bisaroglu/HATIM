using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Users.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Verilen userId icin kullanici profili + istatistiklerini dondurur.
/// GET /api/users/{userId}/profile
/// </summary>
public sealed record GetMyProfileQuery(Guid UserId) : IRequest<UserProfileDto>;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public sealed record UserStatsDto(
    int TotalJuzRead,
    int TotalHatimsJoined,
    int TotalHatimsCompleted,
    int TotalHatimsCreated
);

public sealed record UserProfileDto(
    Guid           UserId,
    string         Email,
    string         FirstName,
    string         LastName,
    string         FullName,
    string?        AvatarUrl,
    DateTimeOffset CreatedAt,
    UserStatsDto   Stats
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, UserProfileDto>
{
    private readonly IApplicationDbContext _db;

    public GetMyProfileQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<UserProfileDto> Handle(
        GetMyProfileQuery request,
        CancellationToken cancellationToken)
    {
        // Tek SQL round-trip: kullanıcı + tüm istatistikler tek projection'da.
        // Önceki implementasyon 5 ayrı await yapıyordu; her biri WiFi üzerinden
        // geçtiğinden toplam gecikme ~5× ağ round-trip süresi kadar artıyordu.
        // EF Core bu projection'ı tek bir SELECT + correlated subquery olarak üretir.
        var row = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == request.UserId && u.IsActive)
            .Select(u => new
            {
                User = u,
                JuzRead = _db.JuzAllocations
                    .Count(a => a.AssignedUserId == u.Id
                             && a.Status == JuzAllocationStatus.Completed),
                HatimsCreated = _db.Hatims
                    .Count(h => h.CreatorUserId == u.Id),
                HatimsJoined = _db.JuzAllocations
                    .Where(a => a.AssignedUserId == u.Id)
                    .Select(a => a.HatimId)
                    .Distinct()
                    .Count(),
                HatimsCompleted = _db.Hatims
                    .Count(h => h.Status == HatimStatus.Completed
                             && _db.JuzAllocations.Any(
                                    a => a.AssignedUserId == u.Id
                                      && a.HatimId == h.Id)),
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Kullanici bulunamadi.");

        return new UserProfileDto(
            UserId:    row.User.Id,
            Email:     row.User.Email,
            FirstName: row.User.FirstName,
            LastName:  row.User.LastName,
            FullName:  row.User.FullName,
            AvatarUrl: null,
            CreatedAt: row.User.CreatedAt,
            Stats: new UserStatsDto(
                TotalJuzRead:         row.JuzRead,
                TotalHatimsJoined:    row.HatimsJoined,
                TotalHatimsCompleted: row.HatimsCompleted,
                TotalHatimsCreated:   row.HatimsCreated
            )
        );
    }
}
