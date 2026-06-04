namespace GlobalHatim.Domain.Events;

public sealed record JuzAssignedToUserEvent(
    Guid AllocationId, Guid HatimId, int JuzNumber, Guid UserId);

public sealed record JuzAssignedToGuestEvent(
    Guid AllocationId, Guid HatimId, int JuzNumber, string GuestFirstName, string GuestLastName);

public sealed record JuzCompletedEvent(
    Guid AllocationId, Guid HatimId, int JuzNumber, int CycleNumber, Guid? UserId);

public sealed record JuzReleasedEvent(
    Guid AllocationId, Guid HatimId, int JuzNumber);
