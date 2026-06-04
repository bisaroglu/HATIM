using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Tüm API controller'larının türediği ortak taban sınıf.
/// IMediator, lazy olarak service provider üzerinden çözümlenir;
/// böylece constructor parametresi taşımadan temiz bir miras hiyerarşisi sağlanır.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    /// <summary>
    /// MediatR ISender — ilk erişimde DI container'dan lazy olarak çözümlenir.
    /// </summary>
    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();
}
