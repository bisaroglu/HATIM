using GlobalHatim.Application.Features.JuzAllocations.Commands;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Cüz tahsis ve tamamlama endpoint'leri.
/// </summary>
public sealed class JuzAllocationsController : BaseApiController
{
    // ── DTOs ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/juzallocations — belirli bir cüzü kullanıcıya/misafire atar.
    /// HatimId + JuzNumber (int 1-30) + UserId (GUID) zorunludur.
    /// Misafir akışı için UserId=null; GuestFirstName+GuestLastName zorunlu.
    /// </summary>
    public sealed record AllocateJuzRequest(
        Guid    HatimId,
        int     JuzNumber,
        Guid?   UserId,
        string? GuestFirstName,
        string? GuestLastName
    );

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

    // ── POST /api/juzallocations ──────────────────────────────────────────────

    /// <summary>
    /// Belirtilen hatim ve cüz numarası için explicit cüz ataması yapar.
    /// HatimDetayPage'den belirli bir cüz seçildiğinde kullanılır.
    /// HatimId (GUID), JuzNumber (int 1-30), UserId (GUID) ile kontrat tam eşleşmeli.
    /// </summary>
    /// <response code="200">Cüz başarıyla atandı.</response>
    /// <response code="400">Cüz müsait değil veya hatim aktif değil.</response>
    /// <response code="422">Doğrulama hatası.</response>
    [HttpPost]
    [ProducesResponseType(typeof(AllocateJuzResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AllocateJuz(
        [FromBody] AllocateJuzRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AllocateJuzCommand(
            HatimId:        request.HatimId,
            JuzNumber:      request.JuzNumber,   // int — 1-30 arası
            UserId:         request.UserId,       // Guid? — kayıtlı kullanıcı
            GuestFirstName: request.GuestFirstName,
            GuestLastName:  request.GuestLastName
        );

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
