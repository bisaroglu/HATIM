using GlobalHatim.Application.Features.Feedbacks.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Geri bildirim endpoint'leri — anonim kullanıcılar da erişebilir.
/// </summary>
public sealed class FeedbacksController : BaseApiController
{
    // ── DTO ───────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/feedbacks gövdesi.
    /// Giriş yapmış kullanıcı için UserId opsiyonel olarak gönderilebilir.
    /// Name (string), Email (string?), Message (string) — frontend form alanlarıyla birebir eşleşir.
    /// </summary>
    public sealed record CreateFeedbackRequest(
        string  Name,
        string? Email,
        string  Message,
        Guid?   UserId
    );

    // ── POST /api/feedbacks ───────────────────────────────────────────────────

    /// <summary>
    /// Yeni bir geri bildirim kaydeder.
    /// Anonim kullanıcılar da erişebilir — [AllowAnonymous].
    /// </summary>
    /// <response code="201">Geri bildirim başarıyla kaydedildi.</response>
    /// <response code="422">Doğrulama hatası — eksik veya hatalı alan.</response>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CreateFeedbackResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateFeedback(
        [FromBody] CreateFeedbackRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new CreateFeedbackCommand(
                Name:    request.Name,
                Email:   request.Email,
                Message: request.Message,
                UserId:  request.UserId
            ),
            cancellationToken);

        return CreatedAtAction(nameof(CreateFeedback), new { id = result.FeedbackId }, result);
    }
}
