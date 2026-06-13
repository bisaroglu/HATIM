using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GlobalHatim.Application.Common.Interfaces;

/// <summary>
/// Application katmanının veritabanına erişim sözleşmesi.
/// Infrastructure bağımlılığını tersine çevirir — Application hiçbir zaman
/// doğrudan EF Core'a bağımlı olmaz, sadece bu interface'e bağlıdır.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<User>              Users              { get; }
    DbSet<UserStats>         UserStats          { get; }
    DbSet<UserSettings>      UserSettings       { get; }
    DbSet<UserLevel>         UserLevels         { get; }
    DbSet<Hatim>             Hatims             { get; }
    DbSet<HatimCategory>     HatimCategories    { get; }
    DbSet<HatimParticipant>  HatimParticipants  { get; }
    DbSet<HatimJoinRequest>  HatimJoinRequests  { get; }
    DbSet<JuzAllocation>     JuzAllocations     { get; }
    DbSet<JuzLookup>         JuzLookup          { get; }
    DbSet<ReadingLog>        ReadingLogs        { get; }
    DbSet<RotationSchedule>  RotationSchedules  { get; }
    DbSet<ContactMessage>    ContactMessages    { get; }
    DbSet<Feedback>          Feedbacks          { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
