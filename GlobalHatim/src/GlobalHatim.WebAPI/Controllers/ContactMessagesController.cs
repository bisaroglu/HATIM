using GlobalHatim.Application.Features.ContactMessages.Commands;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Geri bildirim / iletişim mesajları endpoint'leri.
/// </summary>
public sealed class ContactMessagesController : BaseApiController
{
    // ── DTO ───────────────────────────────────────────────────────────────────

    public sealed record SendMessageRequest(
        string  Name,
        string? EmailOrPhone,
        string  Message
    );

    // ── POST /api/contact-messages ────────────────────────────────────────────

    /// <summary>
    /// Yeni bir geri bildirim / iletişim mesajı oluşturur.
    /// Auth gerektirmez; giriş yapmış kullanıcılar frontend'den ad/e-posta alanlarını
    /// otomatik doldurabilir.
    /// </summary>
    /// <response code="201">Mesaj başarıyla kaydedildi.</response>
    /// <response code="422">Doğrulama hatası.</response>
    [HttpPost]
    [ProducesResponseType(typeof(SendContactMessageResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Send(
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new SendContactMessageCommand(request.Name, request.EmailOrPhone, request.Message),
            cancellationToken);

        return CreatedAtAction(nameof(Send), new { id = result.MessageId }, result);
    }
}
