namespace GlobalHatim.Domain.Events;

public sealed record UserRegisteredEvent(Guid UserId, string Email);
