using GlobalHatim.Application.Features.Hatims.Commands;
using GlobalHatim.Application.Features.Hatims.Queries;
using GlobalHatim.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Hatim yönetimi endpoint'leri.
/// </summary>
public sealed class HatimsController : BaseApiController
{
    // ── DTOs ─────────────────────────────────────────────────────────────────

    public sealed record CreateHatimRequest(
        string    Title,
        string?   Description,
        Guid      CreatorUserId,
        PlanType  PlanType,
        DateOnly  StartDate,
        bool      IsPublic,
        int?      CategoryId,
        DateOnly? EndDate
    );

    // ── GET /api/hatims ───────────────────────────────────────────────────────

    /// <summary>
    /// Herkese açık ve aktif hatimleri listeler. Auth gerektirmez.
    /// </summary>
    /// <response code="200">Hatim listesi başarıyla döndürüldü.</response>
    [HttpGet]
    [ProducesResponseType(typeof(GetActiveHatimsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveHatims(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(
            new GetActiveHatimsQuery(page, pageSize), cancellationToken);
        return Ok(result);
    }

    // ── GET /api/hatims/{id} ──────────────────────────────────────────────────

    /// <summary>
    /// Bir hatimin detayını ve 30 cüzün anlık durumunu döndürür.
    /// </summary>
    /// <response code="200">Hatim detayı başarıyla döndürüldü.</response>
    /// <response code="404">Hatim bulunamadı.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(HatimDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHatimDetails(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetHatimDetailsQuery(id), cancellationToken);
        return Ok(result);
    }

    // ── POST /api/hatims ──────────────────────────────────────────────────────

    /// <summary>
    /// Yeni bir hatim grubu oluşturur.
    /// Private hatimlerde InviteCode otomatik üretilerek yanıtta döner.
    /// </summary>
    /// <response code="201">Hatim başarıyla oluşturuldu.</response>
    /// <response code="400">İş kuralı ihlali veya geçersiz kullanıcı.</response>
    /// <response code="422">Doğrulama hatası — eksik veya hatalı alan.</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateHatimResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateHatim(
        [FromBody] CreateHatimRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateHatimCommand(
            Title:         request.Title,
            Description:   request.Description,
            CreatorUserId: request.CreatorUserId,
            PlanType:      request.PlanType,
            StartDate:     request.StartDate,
            IsPublic:      request.IsPublic,
            CategoryId:    request.CategoryId,
            EndDate:       request.EndDate
        );

        var result = await Mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            actionName: nameof(CreateHatim),
            value:      result);
    }
}
