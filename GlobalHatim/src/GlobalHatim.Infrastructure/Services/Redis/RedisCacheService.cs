using System.Text.Json;
using GlobalHatim.Application.Common.Interfaces;
using StackExchange.Redis;

namespace GlobalHatim.Infrastructure.Services.Redis;

/// <summary>
/// ICacheService implementasyonu.
/// StackExchange.Redis üzerinden çalışır.
///
/// Key Conventions (MIMARI_REFERANS.md):
///   user:stats:{userId}   → UserStats JSON  (TTL: 5 dk)
///   juz:lookup:all        → Tüm cüz hash   (TTL: sınırsız)
///   guest:token:{token}   → AllocationId   (TTL: 72 saat)
/// </summary>
public sealed class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var value = await _db.StringGetAsync(key).ConfigureAwait(false);

        if (value.IsNullOrEmpty)
            return default;

        return JsonSerializer.Deserialize<T>(value!, _jsonOptions);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var serialized = JsonSerializer.Serialize(value, _jsonOptions);
        await _db.StringSetAsync(key, serialized, expiry).ConfigureAwait(false);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        await _db.KeyDeleteAsync(key).ConfigureAwait(false);
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default)
    {
        return await _db.KeyExistsAsync(key).ConfigureAwait(false);
    }
}
