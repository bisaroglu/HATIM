namespace GlobalHatim.Application.Common.Interfaces;

/// <summary>
/// JWT token üretimi için sözleşme.
/// </summary>
public interface IJwtService
{
    string GenerateToken(Guid userId, string email, string fullName);
}
