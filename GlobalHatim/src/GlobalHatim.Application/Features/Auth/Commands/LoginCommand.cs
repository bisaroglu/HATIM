using FluentValidation;
using GlobalHatim.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Features.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────

public sealed record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResult>;

// ── Validator ─────────────────────────────────────────────────────────────────

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IJwtService           _jwt;

    public LoginCommandHandler(IApplicationDbContext db, IJwtService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    public async Task<AuthResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.IsActive, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

        user.RecordLogin();
        await _db.SaveChangesAsync(cancellationToken);

        var token = _jwt.GenerateToken(user.Id, user.Email, user.FullName);
        return new AuthResult(user.Id, user.Email, user.FullName, token);
    }
}
