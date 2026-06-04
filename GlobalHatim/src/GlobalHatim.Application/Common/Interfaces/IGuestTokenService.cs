namespace GlobalHatim.Application.Common.Interfaces;

/// <summary>
/// Misafir kullanıcılar için kısa ömürlü token üretimi ve doğrulama.
/// Token Redis'te "guest:token:{token}" → AllocationId olarak saklanır (TTL: 72 saat).
/// </summary>
public interface IGuestTokenService
{
    /// <summary>Yeni bir guest token üretir ve Redis'e yazar.</summary>
    Task<string> GenerateAsync(Guid allocationId, CancellationToken ct = default);

    /// <summary>Token geçerliyse AllocationId döner, değilse null.</summary>
    Task<Guid?> ValidateAsync(string token, CancellationToken ct = default);

    Task RevokeAsync(string token, CancellationToken ct = default);
}
