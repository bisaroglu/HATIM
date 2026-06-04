using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class HatimConfiguration : IEntityTypeConfiguration<Hatim>
{
    public void Configure(EntityTypeBuilder<Hatim> builder)
    {
        builder.ToTable("hatims");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(h => h.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
        builder.Property(h => h.Description).HasColumnName("description");
        builder.Property(h => h.CreatorUserId).HasColumnName("creator_user_id").IsRequired();
        builder.Property(h => h.CategoryId).HasColumnName("category_id");

        builder.Property(h => h.PlanType)
            .HasColumnName("plan_type")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(h => h.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasDefaultValue(HatimStatus.Draft);

        builder.Property(h => h.IsPublic).HasColumnName("is_public").HasDefaultValue(true);
        builder.Property(h => h.InviteCode).HasColumnName("invite_code").HasMaxLength(20);
        builder.HasIndex(h => h.InviteCode).IsUnique().HasFilter("invite_code IS NOT NULL");

        builder.Property(h => h.CurrentCycle).HasColumnName("current_cycle").HasDefaultValue(1);
        builder.Property(h => h.TotalCycles).HasColumnName("total_cycles").HasDefaultValue(0);
        builder.Property(h => h.StartDate).HasColumnName("start_date").IsRequired();
        builder.Property(h => h.EndDate).HasColumnName("end_date");

        builder.Property(h => h.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        builder.Property(h => h.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

        builder.Ignore(h => h.DomainEvents);
        builder.Ignore(h => h.IsRotating);

        // Indexes
        builder.HasIndex(h => h.Status).HasDatabaseName("idx_hatims_status");
        builder.HasIndex(h => h.IsPublic).HasDatabaseName("idx_hatims_is_public");
        builder.HasIndex(h => h.PlanType).HasDatabaseName("idx_hatims_plan_type");
        builder.HasIndex(h => h.CreatorUserId).HasDatabaseName("idx_hatims_creator");

        // Relationships
        builder.HasOne(h => h.Creator)
            .WithMany()
            .HasForeignKey(h => h.CreatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Category)
            .WithMany(c => c.Hatims)
            .HasForeignKey(h => h.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
