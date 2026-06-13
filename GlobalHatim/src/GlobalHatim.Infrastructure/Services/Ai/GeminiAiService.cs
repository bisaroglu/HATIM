using System.Net.Http.Json;
using System.Text.Json.Serialization;
using GlobalHatim.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GlobalHatim.Infrastructure.Services.Ai;

/// <summary>
/// IAiService'in Google Gemini REST API üzerinden çalışan implementasyonu.
///
/// appsettings.json'da beklenen yapı:
/// <code>
/// "GeminiAI": {
///   "ApiKey": "YOUR_GEMINI_API_KEY",
///   "Model":  "gemini-1.5-flash"
/// }
/// </code>
///
/// İstek URL formatı (v1 — stabil):
///   POST https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}
/// </summary>
public sealed class GeminiAiService : IAiService
{
    // ── Sabitler ──────────────────────────────────────────────────────────────
    private const string BaseUrl      = "https://generativelanguage.googleapis.com/v1/models";
    private const string DefaultModel = "gemini-2.0-flash";
    private const string Action       = "generateContent";

    // ── Bağımlılıklar ─────────────────────────────────────────────────────────
    private readonly HttpClient               _http;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly string                   _apiKey;
    private readonly string                   _model;

    public GeminiAiService(
        HttpClient               http,
        IConfiguration           configuration,
        ILogger<GeminiAiService> logger)
    {
        _http   = http;
        _logger = logger;

        _apiKey = configuration["GeminiAI:ApiKey"]
                  ?? throw new InvalidOperationException(
                      "Gemini API anahtarı (GeminiAI:ApiKey) yapılandırılmamış.");

        _model = configuration["GeminiAI:Model"] ?? DefaultModel;
    }

    // ── IAiService ────────────────────────────────────────────────────────────

    public async Task<string> GenerateResponseAsync(
        string            prompt,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            throw new ArgumentException("Prompt boş olamaz.", nameof(prompt));

        // Üretilen URL örneği:
        // https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIza...
        var url  = $"{BaseUrl}/{_model}:{Action}?key={_apiKey}";
        var body = new GeminiRequest(prompt);

        _logger.LogInformation(
            "Gemini isteği → {Url}",
            $"{BaseUrl}/{_model}:{Action}?key=***");

        var response = await _http.PostAsJsonAsync(url, body, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Gemini API hatası. StatusCode: {Code}, Body: {Body}",
                response.StatusCode, errorBody);

            throw new HttpRequestException(
                $"Gemini API isteği başarısız oldu: {(int)response.StatusCode} {response.ReasonPhrase}");
        }

        var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(
            cancellationToken: cancellationToken);

        var text = result?.Candidates?.FirstOrDefault()
                          ?.Content?.Parts?.FirstOrDefault()
                          ?.Text;

        if (string.IsNullOrWhiteSpace(text))
        {
            _logger.LogWarning("Gemini API boş yanıt döndürdü.");
            return "Asistan şu an yanıt veremedi. Lütfen tekrar deneyin.";
        }

        return text;
    }

    // ── Request DTO'ları (Gemini REST v1 contract) ────────────────────────────

    private sealed record GeminiRequest(
        [property: JsonPropertyName("contents")]
        IReadOnlyList<GeminiContent> Contents)
    {
        public GeminiRequest(string promptText)
            : this([new GeminiContent([new GeminiPart(promptText)])]) { }
    }

    private sealed record GeminiContent(
        [property: JsonPropertyName("parts")]
        IReadOnlyList<GeminiPart> Parts);

    private sealed record GeminiPart(
        [property: JsonPropertyName("text")]
        string Text);

    // ── Response DTO'ları ─────────────────────────────────────────────────────

    private sealed record GeminiResponse(
        [property: JsonPropertyName("candidates")]
        IReadOnlyList<GeminiCandidate>? Candidates);

    private sealed record GeminiCandidate(
        [property: JsonPropertyName("content")]
        GeminiContent? Content);
}
