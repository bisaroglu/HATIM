namespace GlobalHatim.Application.Common.Interfaces;

/// <summary>
/// Yapay zekâ servis sözleşmesi.
/// Infrastructure katmanında Gemini API (veya başka bir sağlayıcı) ile implemente edilir.
/// Bağımlılık tersine çevrilerek Application katmanı Infrastructure'dan tamamen izole kalır.
/// </summary>
public interface IAiService
{
    /// <summary>
    /// Verilen <paramref name="prompt"/> metnini AI modeline gönderir ve
    /// modelin ürettiği yanıt metnini döndürür.
    /// </summary>
    /// <param name="prompt">Kullanıcı veya sistem tarafından oluşturulan istek metni.</param>
    /// <param name="cancellationToken">İptal jetonu.</param>
    /// <returns>AI modelinin ürettiği yanıt metni.</returns>
    Task<string> GenerateResponseAsync(string prompt, CancellationToken cancellationToken = default);
}
