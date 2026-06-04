using GlobalHatim.Domain.Enums;

namespace GlobalHatim.Domain.Events;

public sealed record HatimCreatedEvent(Guid HatimId, Guid CreatorUserId, PlanType PlanType);
public sealed record HatimActivatedEvent(Guid HatimId);
public sealed record HatimCycleAdvancedEvent(Guid HatimId, int NewCycle, int TotalCycles);
public sealed record HatimCompletedEvent(Guid HatimId, int TotalCycles);
