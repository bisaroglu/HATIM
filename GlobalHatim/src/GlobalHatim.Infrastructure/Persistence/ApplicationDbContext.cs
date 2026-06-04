using GlobalHatim.Application.Common.Interfaces;
using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User>             Users             => Set<User>();
    public DbSet<UserStats>        UserStats         => Set<UserStats>();
    public DbSet<UserSettings>     UserSettings      => Set<UserSettings>();
    public DbSet<UserLevel>        UserLevels        => Set<UserLevel>();
    public DbSet<Hatim>            Hatims            => Set<Hatim>();
    public DbSet<HatimCategory>    HatimCategories   => Set<HatimCategory>();
    public DbSet<HatimParticipant> HatimParticipants => Set<HatimParticipant>();
    public DbSet<HatimJoinRequest> HatimJoinRequests => Set<HatimJoinRequest>();
    public DbSet<JuzAllocation>    JuzAllocations    => Set<JuzAllocation>();
    public DbSet<JuzLookup>        JuzLookup         => Set<JuzLookup>();
    public DbSet<ReadingLog>       ReadingLogs       => Set<ReadingLog>();
    public DbSet<RotationSchedule> RotationSchedules => Set<RotationSchedule>();
    public DbSet<ContactMessage>   ContactMessages   => Set<ContactMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // PostgreSQL enum registrations
        modelBuilder.HasPostgresEnum<Domain.Enums.PlanType>("plan_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.HatimStatus>("hatim_status");
        modelBuilder.HasPostgresEnum<Domain.Enums.JuzAllocationStatus>("juz_allocation_status");
        modelBuilder.HasPostgresEnum<Domain.Enums.ParticipantRole>("participant_role");
        modelBuilder.HasPostgresEnum<Domain.Enums.JoinRequestStatus>("join_request_status");
    }
}
