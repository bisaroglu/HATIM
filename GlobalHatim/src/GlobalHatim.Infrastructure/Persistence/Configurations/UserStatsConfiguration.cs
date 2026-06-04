using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class UserStatsConfiguration : IEntityTypeConfiguration<UserStats>
{
    public void Configure(EntityTypeBuilder<UserStats> builder)
    {
        builder.ToTable("user_stats");

        builder.HasKey(s => s.UserId);
        builder.Property(s => s.UserId).HasColumnName("user_id");

        builder.Property(s => s.TotalJuzRead).HasColumnName("total_juz_read").HasDefaultValue(0);
        builder.Property(s => s.TotalHatimsJoined).HasColumnName("total_hatims_joined").HasDefaultValue(0);
        builder.Property(s => s.TotalHatimsCompleted).HasColumnName("total_hatims_completed").HasDefaultValue(0);
        builder.Property(s => s.TotalHatimsCreated).HasColumnName("total_hatims_created").HasDefaultValue(0);
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
    }
}
