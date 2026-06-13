using GlobalHatim.Application.Features.Users.Queries;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Kullanıcı profili ve taahhüt endpoint'leri.
/// </summary>
public sealed class UsersController : BaseApiController
{
    // ── GET /api/users/{userId}/profile ───────────────────────────────────────

    /// <summary>
    /// Kullanıcının profil bilgilerini ve istatistiklerini döndürür.
    /// </summary>
    /// <param name="userId">Profili istenen kullanıcının Guid kimliği.</param>
    /// <response code="200">Profil başarıyla döndürüldü.</response>
    /// <response code="404">Kullanıcı bulunamadı.</response>
    [HttpGet("{userId:guid}/profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(
        [FromRoute] Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetMyProfileQuery(userId), cancellationToken);
        return Ok(result);
    }

    // ── GET /api/users/{userId}/allocations ───────────────────────────────────

    /// <summary>
    /// Kullanıcının aktif cüz taahhütlerini döndürür (status = Assigned).
    /// Profil sayfasındaki "Taahhütlerim" / "Aktif Hatimlerim" bölümünü besler.
    /// </summary>
    /// <param name="userId">Taahhütleri istenen kullanıcının Guid kimliği.</param>
    /// <response code="200">Taahhüt listesi başarıyla döndürüldü.</response>
    [HttpGet("{userId:guid}/allocations")]
    [ProducesResponseType(typeof(IReadOnlyList<UserAllocationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllocations(
        [FromRoute] Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetMyAllocationsQuery(userId), cancellationToken);
        return Ok(result);
    }
}
