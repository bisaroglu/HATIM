using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Infrastructure.BackgroundWorkers;
using GlobalHatim.Infrastructure.Persistence;
using GlobalHatim.Infrastructure.Services.Ai;
using GlobalHatim.Infrastructure.Services.GuestToken;
using GlobalHatim.Infrastructure.Services.Jwt;
using GlobalHatim.Infrastructure.Services.Redis;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace GlobalHatim.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Infrastructure katmanının tüm servislerini IoC container'a kaydeder.
    ///
    /// Gerekli appsettings.json anahtarları:
    ///   ConnectionStrings:DefaultConnection  → PostgreSQL bağlantı dizesi
    ///   ConnectionStrings:Redis              → Redis bağlantı dizesi
    ///   Jwt:Key, Jwt:Issuer, Jwt:Audience, Jwt:ExpiryMinutes
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── PostgreSQL / EF Core ──────────────────────────────────────────
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
            ));

        services.AddScoped<IApplicationDbContext>(
            sp => sp.GetRequiredService<ApplicationDbContext>());

        // ── Redis ─────────────────────────────────────────────────────────
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(
                configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException(
                    "Redis bağlantı dizesi (ConnectionStrings:Redis) yapılandırılmamış.")));

        services.AddSingleton<ICacheService, RedisCacheService>();

        // ── GuestTokenService ─────────────────────────────────────────────
        services.AddSingleton<IGuestTokenService, GuestTokenService>();

        // ── JwtService ────────────────────────────────────────────────────
        services.AddSingleton<IJwtService, JwtService>();

        // ── Gemini AI ─────────────────────────────────────────────────────
        // HttpClient, IHttpClientFactory üzerinden yönetilir (connection pooling).
        services.AddHttpClient<IAiService, GeminiAiService>();

        // ── Background Workers ────────────────────────────────────────────
        services.AddHostedService<HatimRotationWorker>();

        return services;
    }
}
