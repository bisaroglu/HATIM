using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class JuzAllocationConfiguration : IEntityTypeConfiguration<JuzAllocation>
{
    public void Configure(EntityTypeBuilder<JuzAllocation> builder)
    {
        builder.ToTable("juz_allocations");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(a => a.HatimId).HasColumnName("hatim_id").IsRequired();
        builder.Property(a => a.CycleNumber).HasColumnName("cycle_number").HasDefaultValue(1);
        builder.Property(a => a.JuzNumber).HasColumnName("juz_number").HasColumnType("smallint");

        builder.Property(a => a.AssignedUserId).HasColumnName("assigned_user_id");
        builder.Property(a => a.GuestFirstName).HasColumnName("guest_first_name").HasMaxLength(100);
        builder.Property(a => a.GuestLastName).HasColumnName("guest_last_name").HasMaxLength(100);
        builder.Property(a => a.GuestToken).HasColumnName("guest_token").HasMaxLength(500);
        builder.HasIndex(a => a.GuestToken)
            .IsUnique()
            .HasFilter("guest_token IS NOT NULL")
            .HasDatabaseName("idx_juz_alloc_guest_token");

        builder.Property(a => a.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasDefaultValue(JuzAllocationStatus.Available);

        builder.Property(a => a.AssignedAt).HasColumnName("assigned_at");
        builder.Property(a => a.DeadlineAt).HasColumnName("deadline_at");
        builder.Property(a => a.CompletedAt).HasColumnName("completed_at");

        builder.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

        builder.Ignore(a => a.DomainEvents);
        builder.Ignore(a => a.IsAssignedToGuest);
        builder.Ignore(a => a.IsAssignedToUser);
        builder.Ignore(a => a.IsAvailable);
        builder.Ignore(a => a.AssigneeName);

        // XOR constraint: kayıtlı üye VEYA misafir VEYA boş
        builder.ToTable(t => t.HasCheckConstraint(
            "chk_single_assignee",
            @"(assigned_user_id IS NOT NULL AND guest_first_name IS NULL AND guest_token IS NULL)
              OR (assigned_user_id IS NULL AND guest_first_name IS NOT NULL AND guest_token IS NOT NULL)
              OR (assigned_user_id IS NULL AND guest_first_name IS NULL AND guest_token IS NULL)"));

        builder.HasIndex(a => new { a.HatimId, a.CycleNumber, a.JuzNumber }).IsUnique();
        builder.HasIndex(a => new { a.HatimId, a.Status }).HasDatabaseName("idx_juz_alloc_hatim_status");
        builder.HasIndex(a => a.AssignedUserId).HasDatabaseName("idx_juz_alloc_user");

        builder.HasOne(a => a.Hatim)
            .WithMany(h => h.JuzAllocations)
            .HasForeignKey(a => a.HatimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.AssignedUser)
            .WithMany(u => u.Allocations)
            .HasForeignKey(a => a.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.JuzInfo)
            .WithMany(j => j.Allocations)
            .HasForeignKey(a => a.JuzNumber)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
