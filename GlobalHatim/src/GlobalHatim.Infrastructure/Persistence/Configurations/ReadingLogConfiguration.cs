using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class ReadingLogConfiguration : IEntityTypeConfiguration<ReadingLog>
{
    public void Configure(EntityTypeBuilder<ReadingLog> builder)
    {
        builder.ToTable("reading_log");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.HatimId).HasColumnName("hatim_id").IsRequired();
        builder.Property(r => r.AllocationId).HasColumnName("allocation_id").IsRequired();
        builder.Property(r => r.UserId).HasColumnName("user_id");
        builder.Property(r => r.JuzNumber).HasColumnName("juz_number").HasColumnType("smallint");
        builder.Property(r => r.CycleNumber).HasColumnName("cycle_number").HasDefaultValue(1);
        builder.Property(r => r.ConfirmedAt)
            .HasColumnName("confirmed_at").HasDefaultValueSql("NOW()");

        builder.HasIndex(r => r.UserId).HasDatabaseName("idx_reading_log_user");
        builder.HasIndex(r => r.HatimId).HasDatabaseName("idx_reading_log_hatim");
        builder.HasIndex(r => r.ConfirmedAt).IsDescending().HasDatabaseName("idx_reading_log_confirmed");

        builder.HasOne(r => r.Hatim)
            .WithMany()
            .HasForeignKey(r => r.HatimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Allocation)
            .WithOne(a => a.ReadingLog)
            .HasForeignKey<ReadingLog>(r => r.AllocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.User)
            .WithMany(u => u.ReadingLogs)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
