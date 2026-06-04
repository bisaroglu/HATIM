using FluentValidation;
using GlobalHatim.Application.Common.Behaviours;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace GlobalHatim.Application;

/// <summary>
/// Application katmanının tüm servislerini DI container'a kaydeder.
/// WebAPI startup'ında tek satırla çağrılır: services.AddApplication()
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR — tüm Command ve Query handler'ları otomatik tarar
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        // FluentValidation — tüm Validator sınıflarını otomatik tarar
        services.AddValidatorsFromAssembly(assembly);

        // Pipeline behaviour: her handler çalışmadan önce validation
        services.AddTransient(
            typeof(IPipelineBehavior<,>),
            typeof(ValidationBehaviour<,>));

        return services;
    }
}
