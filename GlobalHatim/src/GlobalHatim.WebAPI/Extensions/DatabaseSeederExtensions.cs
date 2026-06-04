using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Infrastructure.Persistence;
using GlobalHatim.Infrastructure.Persistence.Seeders;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalHatim.WebAPI.Extensions;

public static class DatabaseSeederExtensions
{
    /// <summary>
    /// Uygulama başlarken veritabanı seed işlemlerini çalıştırır.
    /// Her seeder kendi içinde idempotent olduğundan defalarca çağrılabilir.
    /// </summary>
    public static async Task SeedDatabaseAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();

        var db     = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var cache  = scope.ServiceProvider.GetRequiredService<ICacheService>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILogger<JuzLookupSeeder>>();

        var seeder = new JuzLookupSeeder(db, cache, logger);
        await seeder.SeedAsync();
    }
}
