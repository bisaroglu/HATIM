using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Application.Features.JuzAllocations.Commands;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Hatims.Commands;

// -- Command ------------------------------------------------------------------

/// <summary>
/// Kullanıcının seçtiği belirli cüzleri (birden fazla olabilir) tek seferde atar.
/// Her bir cüz numarası için AllocateJuzCommand dispatch edilir; tüm atamalar
/// tek transaction içinde gerçekleşir.
///
/// POST /api/hatims/{id}/join-selected
/// </summary>
public sealed record JoinHatimWithJuzsCommand(
    Guid               HatimId,
    IReadOnlyList<int> JuzNumbers,
    Guid?              UserId,
    string?            GuestFirstName,
    string?            GuestLastName,
    /// <summary>
    /// Hatim sahibinin başkası adına cüz alması (vekaleten atama).
    /// Dolu olduğunda UserId'den bağımsız olarak misafir gibi kaydedilir;
    /// cüz grid'inde bu isim gösterilir.
    /// </summary>
    string?            ProxyName = null
) : IRequest<IReadOnlyList<AllocateJuzResult>>;

// -- Validator ----------------------------------------------------------------

public sealed class JoinHatimWithJuzsCommandValidator : AbstractValidator<JoinHatimWithJuzsCommand>
{
    public JoinHatimWithJuzsCommandValidator()
    {
        RuleFor(x => x.HatimId)
            .NotEmpty().WithMessage("HatimId bos olamaz.");

        RuleFor(x => x.JuzNumbers)
            .NotEmpty().WithMessage("En az bir cüz secmelisiniz.")
            .Must(j => j != null && j.All(n => n >= 1 && n <= 30))
            .WithMessage("Tüm cüz numaralari 1-30 arasinda olmalidir.");

        // Misafir akisi (UserId yok, ProxyName yok): en az GuestFirstName zorunlu
        // GuestLastName opsiyonel; kullanici tek isim de girebilir
        When(x => !x.UserId.HasValue && string.IsNullOrWhiteSpace(x.ProxyName), () =>
        {
            RuleFor(x => x.GuestFirstName)
                .NotEmpty().WithMessage("Misafir adi zorunludur.");
        });

        // Vekaleten atama (UserId var + ProxyName var): gecerli kombinasyon
        // Diger durumlar: UserId var -> GuestFirstName olmamali
        RuleFor(x => x)
            .Must(x => !(x.UserId.HasValue
                         && !string.IsNullOrWhiteSpace(x.GuestFirstName)
                         && string.IsNullOrWhiteSpace(x.ProxyName)))
            .WithMessage("UserId ve GuestFirstName ayni anda saglanamaz (ProxyName kullanin).");

        // ProxyName varsa tek kelime yeterli, bos olmasin
        When(x => !string.IsNullOrWhiteSpace(x.ProxyName), () =>
        {
            RuleFor(x => x.ProxyName)
                .MaximumLength(100).WithMessage("Vekil adi en fazla 100 karakter olabilir.");
        });
    }
}

// -- Handler ------------------------------------------------------------------

public sealed class JoinHatimWithJuzsCommandHandler
    : IRequestHandler<JoinHatimWithJuzsCommand, IReadOnlyList<AllocateJuzResult>>
{
    private readonly IApplicationDbContext _db;
    private readonly IMediator             _mediator;

    public JoinHatimWithJuzsCommandHandler(IApplicationDbContext db, IMediator mediator)
    {
        _db       = db;
        _mediator = mediator;
    }

    public async Task<IReadOnlyList<AllocateJuzResult>> Handle(
        JoinHatimWithJuzsCommand request,
        CancellationToken        cancellationToken)
    {
        // -- 1. Hatim aktif mi? ----------------------------------------------
        var hatim = await _db.Hatims
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == request.HatimId, cancellationToken)
            ?? throw new KeyNotFoundException("Hatim bulunamadi.");

        if (hatim.Status != HatimStatus.Active)
            throw new InvalidOperationException("Bu hatim su anda aktif degil, katilim alinmiyor.");

        // -- 2. Secilen cüzleri sirayla ata ----------------------------------
        // * Ayni kullanici ayni hatimden birden fazla cüz alabilir (sinir yok).
        // * Secilen cüzün Available olup olmadigi AllocateJuzCommand içinde kontrol edilir.
        var results = new List<AllocateJuzResult>();

        foreach (var juzNumber in request.JuzNumbers.Distinct().OrderBy(n => n))
        {
            var result = await _mediator.Send(new AllocateJuzCommand(
                HatimId:        request.HatimId,
                JuzNumber:      juzNumber,
                UserId:         request.UserId,
                GuestFirstName: request.GuestFirstName,
                GuestLastName:  request.GuestLastName,
                ProxyName:      request.ProxyName
            ), cancellationToken);

            results.Add(result);
        }

        return results;
    }
}
