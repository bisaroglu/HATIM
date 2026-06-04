using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class RotationScheduleConfiguration : IEntityTypeConfiguration<RotationSchedule>
{
    public void Configure(EntityTypeBuilder<RotationSchedule> builder)
    {
        builder.ToTable("rotation_schedule");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.HatimId).HasColumnName("hatim_id").IsRequired();
        builder.Property(r => r.CycleNumber).HasColumnName("cycle_number").IsRequired();
        builder.Property(r => r.ScheduledDate).HasColumnName("scheduled_date").IsRequired();
        builder.Property(r => r.IsRamadanPeriod).HasColumnName("is_ramadan_period").HasDefaultValue(false);
        builder.Property(r => r.ActualRotationDate).HasColumnName("actual_rotation_date");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

        builder.Ignore(r => r.DomainEvents);

        builder.HasIndex(r => new { r.HatimId, r.CycleNumber }).IsUnique();

        builder.HasOne(r => r.Hatim)
            .WithMany(h => h.RotationSchedules)
            .HasForeignKey(r => r.HatimId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
