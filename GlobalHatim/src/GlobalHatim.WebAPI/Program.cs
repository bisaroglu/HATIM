using System.Text;
using GlobalHatim.Application;
using GlobalHatim.Infrastructure;
using GlobalHatim.WebAPI.Extensions;
using GlobalHatim.WebAPI.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

// ── Serilog bootstrap logger (startup hatalarını yakalar) ─────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ───────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // ── Application & Infrastructure katmanları ───────────────────────────────
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── JWT Authentication ────────────────────────────────────────────────────
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("Jwt:Key yapılandırılmamış.");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                ValidAudience            = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };
        });

    // Varsayılan yetkilendirme politikası — controller bazlı [Authorize] attr gerektirir.
    // FallbackPolicy tanımlanmadığı için attr olmayan endpointler herkese açıktır.
    builder.Services.AddAuthorization();

    // ── Controllers ───────────────────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(opts =>
        {
            opts.JsonSerializerOptions.PropertyNamingPolicy =
                System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title       = "GlobalHatim API",
            Version     = "v1",
            Description = "Hatim yönetim sistemi REST API'si"
        });

        // JWT Swagger desteği
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name        = "Authorization",
            Type        = SecuritySchemeType.ApiKey,
            Scheme      = "Bearer",
            BearerFormat = "JWT",
            In          = ParameterLocation.Header,
            Description = "JWT token: Bearer {token}"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                        { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });

        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
            c.IncludeXmlComments(xmlPath);
    });

    // ── CORS ──────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? [];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DefaultPolicy", policy =>
        {
            if (builder.Environment.IsDevelopment() || allowedOrigins.Length == 0)
            {
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            }
            else
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            }
        });
    });

    // ── Health checks ─────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks();

    // ── Build ─────────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ── Middleware pipeline ───────────────────────────────────────────────────

    // 1. Global exception handler — tüm katmanların önünde olmalı
    app.UseExceptionHandling();

    // 2. Swagger — yalnızca development'ta
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "GlobalHatim API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // 3. HTTPS yönlendirme — yalnızca production'da aktif.
    //    Development'ta Vite proxy HTTP üzerinden bağlandığı için
    //    bu middleware 301 döndürüp proxy zincirini kırıyordu.
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    // 4. CORS — Authentication'dan önce
    app.UseCors("DefaultPolicy");

    // 5. Kimlik doğrulama & yetkilendirme
    app.UseAuthentication();
    app.UseAuthorization();

    // 6. Controller route'ları
    app.MapControllers();

    // 7. Health check endpoint
    app.MapHealthChecks("/health");

    // ── Veritabanı seed işlemleri ─────────────────────────────────────────────
    await app.SeedDatabaseAsync();

    // ── Çalıştır ──────────────────────────────────────────────────────────────
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Uygulama başlatılamadı.");
}
finally
{
    await Log.CloseAndFlushAsync();
}
