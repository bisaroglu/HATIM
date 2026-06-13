using GlobalHatim.Application.Features.Hatims.Commands;
using GlobalHatim.Application.Features.Hatims.Queries;
using GlobalHatim.Application.Features.JuzAllocations.Commands;
using GlobalHatim.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GlobalHatim.WebAPI.Controllers;

/// <summary>
/// Hatim yönetimi endpoint'leri.
/// </summary>
public sealed class HatimsController : BaseApiController
{
    // ── DTOs ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/hatims gövdesi.
    /// PlanType: 1=Fixed, 2=Cyclic, 3=Daily, 4=Weekly
    /// ReadPacing: 1=Daily1Juz, 2=Every2Days1Juz, 3=Every4Days1Juz
    /// </summary>
    public sealed record CreateHatimRequest(
        string      Title,
        string?     Description,
        Guid        CreatorUserId,
        PlanType    PlanType,
        ReadPacing  ReadPacing,
        DateOnly    StartDate,
        bool        IsPublic,
        int?        CategoryId,
        DateOnly?   EndDate
    );

    // ── GET /api/hatims/buHafta?kullaniciId={guid} ────────────────────────────

    /// <summary>
    /// Kullanıcının aktif (Assigned) cüz atamasını döndürür.
    /// Mobil Dashboard ekranını besler.
    /// </summary>
    /// <param name="kullaniciId">Sorgulanacak kullanıcının GUID'i.</param>
    /// <response code="200">Aktif cüz bilgisi döndürüldü.</response>
    /// <response code="404">Kullanıcının aktif cüz ataması bulunamadı.</response>
    [HttpGet("buHafta")]
    [ProducesResponseType(typeof(BuHaftaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBuHafta(
        [FromQuery] Guid kullaniciId,
        CancellationToken cancellationToken)
    {
        var sonuc = await Mediator.Send(new GetBuHaftaQuery(kullaniciId), cancellationToken);

        // Aktif atama yoksa 404 dön
        if (sonuc is null)
            return NotFound("Bu kullanıcıya ait aktif cüz ataması bulunamadı.");

        return Ok(sonuc);
    }

    // ── GET /api/hatims/takvim?kullaniciId={guid} ─────────────────────────────

    /// <summary>
    /// Kullanıcının tüm döngü geçmişini (tamamlanan + aktif) takvim olarak döndürür.
    /// Mobil "52 Haftalık Takvim" ekranını besler.
    /// </summary>
    /// <param name="kullaniciId">Sorgulanacak kullanıcının GUID'i.</param>
    /// <response code="200">Takvim listesi döndürüldü.</response>
    [HttpGet("takvim")]
    [ProducesResponseType(typeof(TakvimSonucDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTakvim(
        [FromQuery] Guid kullaniciId,
        CancellationToken cancellationToken)
    {
        var sonuc = await Mediator.Send(new GetTakvimQuery(kullaniciId), cancellationToken);
        return Ok(sonuc);
    }

    // ── GET /api/hatims ───────────────────────────────────────────────────────

    /// <summary>
    /// Herkese açık ve aktif hatimleri listeler. Auth gerektirmez.
    /// </summary>
    /// <response code="200">Hatim listesi başarıyla döndürüldü.</response>
    [HttpGet]
    [ProducesResponseType(typeof(GetActiveHatimsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveHatims(
        [FromQuery] int     page       = 1,
        [FromQuery] int     pageSize   = 20,
        [FromQuery] string? search     = null,
        CancellationToken   cancellationToken = default)
    {
        var result = await Mediator.Send(
            new GetActiveHatimsQuery(page, pageSize, search), cancellationToken);
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
            ReadPacing:    request.ReadPacing,
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

    // ── POST /api/hatims/{id}/join ────────────────────────────────────────────

    /// <summary>
    /// Mevcut döngüdeki ilk boş cüzü otomatik olarak kullanıcıya/misafire atar.
    /// Kayıtlı kullanıcı için UserId, misafir için GuestFirstName + GuestLastName gönderilir.
    /// </summary>
    /// <param name="id">Katılınacak hatimin Guid kimliği.</param>
    /// <response code="200">Cüz başarıyla atandı.</response>
    /// <response code="400">Hatim aktif değil, boş cüz yok veya zaten katılmış.</response>
    /// <response code="422">Doğrulama hatası — eksik veya hatalı alan.</response>
    [HttpPost("{id:guid}/join")]
    [ProducesResponseType(typeof(AllocateJuzResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> JoinHatim(
        [FromRoute] Guid id,
        [FromBody]  JoinHatimRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new AutoJoinHatimCommand(
                HatimId:        id,
                UserId:         request.UserId,
                GuestFirstName: request.GuestFirstName,
                GuestLastName:  request.GuestLastName
            ),
            cancellationToken);

        return Ok(result);
    }

    /// <summary>POST /api/hatims/{id}/join gövdesi.</summary>
    public sealed record JoinHatimRequest(
        Guid?   UserId,
        string? GuestFirstName,
        string? GuestLastName
    );

    // ── GET /api/hatims/{id}/available-juzs ──────────────────────────────────

    /// <summary>
    /// Mevcut döngüde henüz atanmamış (Available) cüzlerin numaralarını döndürür.
    /// JoinHatimModal'ın cüz seçim grid'ini besler.
    /// </summary>
    /// <param name="id">Hatim Guid kimliği.</param>
    /// <response code="200">Boş cüz numaraları listesi döndürüldü.</response>
    /// <response code="404">Hatim bulunamadı.</response>
    [HttpGet("{id:guid}/available-juzs")]
    [ProducesResponseType(typeof(AvailableJuzsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAvailableJuzs(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetAvailableJuzsQuery(id), cancellationToken);
        return Ok(result);
    }

    // ── POST /api/hatims/{id}/join-selected ───────────────────────────────────

    /// <summary>
    /// Kullanıcının seçtiği belirli cüzleri tek seferde atar.
    /// Kullanıcı birden fazla cüz seçebilir; her biri ayrı ayrı atanır ve toplu yanıt döner.
    /// </summary>
    /// <param name="id">Katılınacak hatimin Guid kimliği.</param>
    /// <response code="200">Seçilen cüzler başarıyla atandı.</response>
    /// <response code="400">Hatim aktif değil, cüz müsait değil veya zaten katılmış.</response>
    /// <response code="422">Doğrulama hatası — eksik veya hatalı alan.</response>
    [HttpPost("{id:guid}/join-selected")]
    [ProducesResponseType(typeof(IReadOnlyList<AllocateJuzResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> JoinWithSelectedJuzs(
        [FromRoute] Guid id,
        [FromBody]  JoinWithJuzsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new JoinHatimWithJuzsCommand(
                HatimId:        id,
                JuzNumbers:     request.JuzNumbers,
                UserId:         request.UserId,
                GuestFirstName: request.GuestFirstName,
                GuestLastName:  request.GuestLastName,
                ProxyName:      request.ProxyName
            ),
            cancellationToken);

        return Ok(result);
    }

    /// <summary>POST /api/hatims/{id}/join-selected gövdesi.</summary>
    public sealed record JoinWithJuzsRequest(
        IReadOnlyList<int> JuzNumbers,
        Guid?   UserId,
        string? GuestFirstName,
        string? GuestLastName,
        /// <summary>Hatim sahibinin başkası adına cüz alması; set edilince proxy akışı devreye girer.</summary>
        string? ProxyName = null
    );
}
