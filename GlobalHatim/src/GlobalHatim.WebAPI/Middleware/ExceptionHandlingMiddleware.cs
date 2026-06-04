using FluentValidation;
using GlobalHatim.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace GlobalHatim.WebAPI.Middleware;

/// <summary>
/// Uygulama genelinde fırlatılan tüm exception'ları yakalar ve
/// RFC 7807 (ProblemDetails) uyumlu, structured JSON hata yanıtına dönüştürür.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented        = false
    };

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            ValidationException ve => (
                StatusCodes.Status422UnprocessableEntity,
                "Doğrulama hatası oluştu.",
                ve.Errors
                  .GroupBy(e => e.PropertyName)
                  .ToDictionary(
                      g => g.Key,
                      g => g.Select(e => e.ErrorMessage).ToArray()
                  )
            ),

            DomainException de => (
                StatusCodes.Status400BadRequest,
                de.Message,
                (Dictionary<string, string[]>?)null
            ),

            InvalidOperationException ioe => (
                StatusCodes.Status400BadRequest,
                ioe.Message,
                (Dictionary<string, string[]>?)null
            ),

            UnauthorizedAccessException => (
                StatusCodes.Status403Forbidden,
                "Bu işlem için yetkiniz bulunmamaktadır.",
                (Dictionary<string, string[]>?)null
            ),

            KeyNotFoundException knfe => (
                StatusCodes.Status404NotFound,
                knfe.Message,
                (Dictionary<string, string[]>?)null
            ),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Beklenmeyen bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
                (Dictionary<string, string[]>?)null
            )
        };

        // 500 hataları için ayrıntılı loglama
        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception,
                "Unhandled exception — {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception,
                "Handled exception ({StatusCode}) — {Method} {Path}",
                statusCode,
                context.Request.Method,
                context.Request.Path);
        }

        var problem = new ProblemDetails
        {
            Status   = statusCode,
            Title    = title,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"]  = context.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        context.Response.StatusCode  = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(problem, JsonOptions));
    }
}

/// <summary>
/// Middleware'i IApplicationBuilder'a kolayca eklemek için extension.
/// </summary>
public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(
        this IApplicationBuilder app)
        => app.UseMiddleware<ExceptionHandlingMiddleware>();
}
