using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────

public sealed record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password
) : IRequest<AuthResult>;

public sealed record AuthResult(
    Guid   UserId,
    string Email,
    string FullName,
    string Token
);

// ── Validator ─────────────────────────────────────────────────────────────────

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(128);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IJwtService           _jwt;

    public RegisterCommandHandler(IApplicationDbContext db, IJwtService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    public async Task<AuthResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // E-posta benzersizliği kontrolü
        var emailExists = await _db.Users
            .AnyAsync(u => u.Email == request.Email.Trim().ToLowerInvariant(), cancellationToken);

        if (emailExists)
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");

        // Şifreyi BCrypt ile hash'le
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(request.Email, passwordHash, request.FirstName, request.LastName);
        _db.Users.Add(user);

        // Varsayılan istatistik ve ayar oluştur
        _db.UserStats.Add(UserStats.CreateForUser(user.Id));
        _db.UserSettings.Add(UserSettings.CreateDefault(user.Id));

        await _db.SaveChangesAsync(cancellationToken);

        var token = _jwt.GenerateToken(user.Id, user.Email, user.FullName);
        return new AuthResult(user.Id, user.Email, user.FullName, token);
    }
}
