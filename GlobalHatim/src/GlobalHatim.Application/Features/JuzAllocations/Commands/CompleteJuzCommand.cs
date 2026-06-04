using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.JuzAllocations.Commands;

// ── Command ──────────────────────────────────────────────────────────────────

/// <summary>
/// Bir kullanıcı veya misafirin üstlendiği cüzü tamamlar.
///
/// Akış:
///   1. JuzAllocation.Complete()  →  durum ASSIGNED → COMPLETED
///   2. ReadingLog kaydı oluşturulur  (audit trail + Geçmiş ekranı)
///   3. Kayıtlı kullanıcıysa UserStats.TotalJuzRead artırılır + Redis cache temizlenir
///   4. Hatimin tüm cüzleri tamamlandıysa Hatim.Complete() çağrılır
///
/// Yetki kısıtı:
///   - Kayıtlı kullanıcı: requesterUserId ile AllocationId'nin AssignedUserId'si eşleşmeli
///   - Misafir: guestToken ile AllocationId'nin GuestToken'ı eşleşmeli
/// </summary>
public sealed record CompleteJuzCommand(
    Guid    AllocationId,
    Guid?   RequesterUserId,  // kayıtlı kullanıcı için
    string? GuestToken        // misafir için
) : IRequest<CompleteJuzResult>;

public sealed record CompleteJuzResult(
    Guid   AllocationId,
    Guid   HatimId,
    int    JuzNumber,
    bool   HatimCompleted  // tüm hatim kapandıysa true
);

// ── Validator ────────────────────────────────────────────────────────────────

public sealed class CompleteJuzCommandValidator : AbstractValidator<CompleteJuzCommand>
{
    public CompleteJuzCommandValidator()
    {
        RuleFor(x => x.AllocationId)
            .NotEmpty().WithMessage("AllocationId boş olamaz.");

        // Kullanıcı VEYA guest token'dan biri olmalı, ikisi birden boş olamaz
        RuleFor(x => x)
            .Must(x => x.RequesterUserId.HasValue || !string.IsNullOrWhiteSpace(x.GuestToken))
            .WithMessage("RequesterUserId veya GuestToken'dan biri sağlanmalıdır.");

        // İkisi birden dolu olamaz
        RuleFor(x => x)
            .Must(x => !(x.RequesterUserId.HasValue && !string.IsNullOrWhiteSpace(x.GuestToken)))
            .WithMessage("RequesterUserId ve GuestToken aynı anda sağlanamaz.");
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

public sealed class CompleteJuzCommandHandler
    : IRequestHandler<CompleteJuzCommand, CompleteJuzResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICacheService         _cache;

    public CompleteJuzCommandHandler(IApplicationDbContext db, ICacheService cache)
    {
        _db    = db;
        _cache = cache;
    }

    public async Task<CompleteJuzResult> Handle(
        CompleteJuzCommand request,
        CancellationToken  cancellationToken)
    {
        // ── 1. Allocation'ı yükle ────────────────────────────────────────────
        var allocation = await _db.JuzAllocations
            .Include(a => a.Hatim)
            .FirstOrDefaultAsync(a => a.Id == request.AllocationId, cancellationToken)
            ?? throw new InvalidOperationException("Cüz tahsisi bulunamadı.");

        if (allocation.Status != JuzAllocationStatus.Assigned)
            throw new InvalidOperationException(
                $"Bu cüz tamamlanamaz. Mevcut durum: {allocation.Status}");

        // ── 2. Yetki kontrolü ────────────────────────────────────────────────
        if (request.RequesterUserId.HasValue)
        {
            if (allocation.AssignedUserId != request.RequesterUserId)
                throw new UnauthorizedAccessException("Bu cüz size atanmamış.");
        }
        else
        {
            // Misafir token kontrolü — token Redis'te de doğrulanabilir,
            // burada DB'deki GuestToken ile karşılaştırıyoruz.
            if (allocation.GuestToken != request.GuestToken)
                throw new UnauthorizedAccessException("Geçersiz misafir token'ı.");
        }

        // ── 3. Durum geçişi: ASSIGNED → COMPLETED ───────────────────────────
        allocation.Complete();

        // ── 4. ReadingLog audit kaydı ────────────────────────────────────────
        var log = ReadingLog.Create(
            hatimId:      allocation.HatimId,
            allocationId: allocation.Id,
            juzNumber:    allocation.JuzNumber,
            cycleNumber:  allocation.CycleNumber,
            userId:       allocation.AssignedUserId);

        _db.ReadingLogs.Add(log);

        // ── 5. UserStats güncelle (yalnızca kayıtlı kullanıcı için) ─────────
        if (allocation.AssignedUserId.HasValue)
        {
            var stats = await _db.UserStats
                .FirstOrDefaultAsync(s => s.UserId == allocation.AssignedUserId, cancellationToken);

            if (stats is null)
            {
                stats = UserStats.CreateForUser(allocation.AssignedUserId.Value);
                _db.UserStats.Add(stats);
            }

            stats.IncrementJuzRead();

            // Redis cache'i geçersiz kıl — sonraki profil isteğinde taze verisi yüklensin
            await _cache.RemoveAsync(
                $"user:stats:{allocation.AssignedUserId.Value}", cancellationToken);
        }

        // ── 6. Hatim tamamlandı mı? ──────────────────────────────────────────
        //    Bu döngüdeki tüm cüzler COMPLETED ise hatimi kapat.
        var hatimCompleted = false;

        var pendingCount = await _db.JuzAllocations
            .CountAsync(
                a => a.HatimId      == allocation.HatimId
                  && a.CycleNumber  == allocation.CycleNumber
                  && a.Status       != JuzAllocationStatus.Completed,
                cancellationToken);

        if (pendingCount == 0)
        {
            allocation.Hatim.Complete();
            hatimCompleted = true;

            // Hatim tamamlandıysa katılımcıların TotalHatimsCompleted sayaçlarını artır
            var participantIds = await _db.HatimParticipants
                .Where(p => p.HatimId == allocation.HatimId)
                .Select(p => p.UserId)
                .ToListAsync(cancellationToken);

            var participantStats = await _db.UserStats
                .Where(s => participantIds.Contains(s.UserId))
                .ToListAsync(cancellationToken);

            foreach (var stat in participantStats)
            {
                stat.IncrementHatimsCompleted();
                await _cache.RemoveAsync($"user:stats:{stat.UserId}", cancellationToken);
            }

            // Kayıt olmayan katılımcılar için UserStats oluştur
            var existingIds = participantStats.Select(s => s.UserId).ToHashSet();
            foreach (var pid in participantIds.Where(id => !existingIds.Contains(id)))
            {
                var newStats = UserStats.CreateForUser(pid);
                newStats.IncrementHatimsCompleted();
                _db.UserStats.Add(newStats);
            }
        }

        // ── 7. Kaydet ────────────────────────────────────────────────────────
        await _db.SaveChangesAsync(cancellationToken);

        return new CompleteJuzResult(
            AllocationId:   allocation.Id,
            HatimId:        allocation.HatimId,
            JuzNumber:      allocation.JuzNumber,
            HatimCompleted: hatimCompleted);
    }
}
