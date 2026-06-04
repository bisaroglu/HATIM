using GlobalHatim.Application.Features.Auth.Commands;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Kimlik doğrulama endpoint'leri.
/// </summary>
public sealed class AuthController : BaseApiController
{
    // ── POST /api/auth/register ───────────────────────────────────────────────

    /// <summary>
    /// Yeni kullanıcı kaydı oluşturur ve JWT döner.
    /// </summary>
    /// <response code="200">Kayıt başarılı, JWT döndürüldü.</response>
    /// <response code="400">E-posta zaten kayıtlı veya iş kuralı ihlali.</response>
    /// <response code="422">Doğrulama hatası.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    /// <summary>
    /// Mevcut kullanıcıyla oturum açar ve JWT döner.
    /// </summary>
    /// <response code="200">Oturum açıldı, JWT döndürüldü.</response>
    /// <response code="401">E-posta veya şifre hatalı.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
