using GlobalHatim.Application.Common.Interfaces;

namespace GlobalHatim.Infrastructure.Services.GuestToken;

/// <summary>
/// IGuestTokenService implementasyonu.
///
/// Token üretimi: 32-byte kriptografik rastgele veri → Base64Url string.
/// Hafif ve JWT bağımlılığı gerektirmez; allocationId doğruluğu Redis'te saklanır.
///
/// Redis key: "guest:token:{token}" → AllocationId string
/// TTL: 72 saat (MIMARI_REFERANS.md — Karar K)
/// </summary>
public sealed class GuestTokenService : IGuestTokenService
{
    private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(72);
    private const string KeyPrefix = "guest:token:";

    private readonly ICacheService _cache;

    public GuestTokenService(ICacheService cache)
    {
        _cache = cache;
    }

    public async Task<string> GenerateAsync(Guid allocationId, CancellationToken ct = default)
    {
        // 32 byte = 256 bit güvenli rastgele token
        var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        await _cache.SetAsync(
            key:    $"{KeyPrefix}{token}",
            value:  allocationId.ToString(),
            expiry: TokenTtl,
            ct:     ct
        ).ConfigureAwait(false);

        return token;
    }

    public async Task<Guid?> ValidateAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var value = await _cache.GetAsync<string>(
            $"{KeyPrefix}{token}", ct).ConfigureAwait(false);

        if (value is null)
            return null;

        return Guid.TryParse(value, out var allocationId) ? allocationId : null;
    }

    public async Task RevokeAsync(string token, CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(token))
            await _cache.RemoveAsync($"{KeyPrefix}{token}", ct).ConfigureAwait(false);
    }
}
