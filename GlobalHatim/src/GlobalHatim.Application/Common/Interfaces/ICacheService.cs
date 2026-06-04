namespace GlobalHatim.Application.Common.Interfaces;

/// <summary>
/// Redis önbellekleme sözleşmesi.
/// Infrastructure katmanında StackExchange.Redis ile implemente edilir.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task<bool> ExistsAsync(string key, CancellationToken ct = default);
}
