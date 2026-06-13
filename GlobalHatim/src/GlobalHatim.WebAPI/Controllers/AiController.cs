using GlobalHatim.Application.Features.Ai.Commands;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Yapay Zekâ Asistan API'si.
/// Mevcut Hatim / Cüz / Kullanıcı modüllerinden tamamen bağımsız, izole bir modüldür.
/// </summary>
[Tags("AI Assistant")]
public sealed class AiController : BaseApiController
{
    /// <summary>
    /// Kullanıcıdan gelen mesajı Gemini AI asistanına iletir ve yanıtı döndürür.
    /// </summary>
    /// <remarks>
    /// Örnek istek:
    /// <code>
    /// POST /api/ai/chat
    /// { "message": "Hatim nedir?" }
    /// </code>
    /// </remarks>
    /// <param name="request">Kullanıcı mesajını içeren istek nesnesi.</param>
    /// <param name="cancellationToken">İptal jetonu.</param>
    /// <returns>AI asistanının ürettiği yanıt metni.</returns>
    /// <response code="200">Yanıt başarıyla üretildi.</response>
    /// <response code="400">Geçersiz istek (boş mesaj vb.).</response>
    /// <response code="500">Upstream AI servisi hatası.</response>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(ChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Chat(
        [FromBody] ChatRequest      request,
        CancellationToken           cancellationToken)
    {
        var command = new AskAiAssistantCommand(request.Message);
        var result  = await Mediator.Send(command, cancellationToken);
        return Ok(new ChatResponse(result.Reply));
    }

    // ── Request / Response modelleri ──────────────────────────────────────────

    /// <summary>AI sohbet isteği.</summary>
    public sealed record ChatRequest(
        /// <summary>Kullanıcının yazdığı mesaj (max 4000 karakter).</summary>
        string Message);

    /// <summary>AI sohbet yanıtı.</summary>
    public sealed record ChatResponse(
        /// <summary>AI modelinin ürettiği yanıt metni.</summary>
        string Reply);
}
