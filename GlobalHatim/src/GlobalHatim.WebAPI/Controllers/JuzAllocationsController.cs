using GlobalHatim.Application.Features.JuzAllocations.Commands;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Cüz tahsis ve tamamlama endpoint'leri.
/// </summary>
public sealed class JuzAllocationsController : BaseApiController
{
    // ── DTO ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/juzallocations/{id}/complete — cüz tamamlama isteği gövdesi.
    /// Kayıtlı kullanıcı için RequesterUserId, misafir için GuestToken doldurulur;
    /// ikisi aynı anda gönderilemez.
    /// </summary>
    public sealed record CompleteJuzRequest(
        Guid?   RequesterUserId,
        string? GuestToken
    );

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Belirtilen cüz tahsisini tamamlar.
    /// Tüm cüzler tamamlanmışsa hatim otomatik olarak kapatılır.
    /// </summary>
    /// <param name="id">Tamamlanacak JuzAllocation'ın kimliği.</param>
    /// <response code="200">Cüz başarıyla tamamlandı.</response>
    /// <response code="400">İş kuralı ihlali (örn. cüz zaten tamamlanmış).</response>
    /// <response code="403">Yetkisiz erişim — cüz bu kullanıcıya/token'a atanmamış.</response>
    /// <response code="422">Doğrulama hatası — eksik veya hatalı alan.</response>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(CompleteJuzResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CompleteJuz(
        [FromRoute] Guid id,
        [FromBody]  CompleteJuzRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CompleteJuzCommand(
            AllocationId:    id,
            RequesterUserId: request.RequesterUserId,
            GuestToken:      request.GuestToken
        );

        var result = await Mediator.Send(command, cancellationToken);

        return Ok(result);
    }
}
