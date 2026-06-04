using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class HatimJoinRequestConfiguration : IEntityTypeConfiguration<HatimJoinRequest>
{
    public void Configure(EntityTypeBuilder<HatimJoinRequest> builder)
    {
        builder.ToTable("hatim_join_requests");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.HatimId).HasColumnName("hatim_id").IsRequired();
        builder.Property(r => r.UserId).HasColumnName("user_id").IsRequired();

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasDefaultValue(JoinRequestStatus.Pending);

        builder.Property(r => r.RequestedAt).HasColumnName("requested_at").HasDefaultValueSql("NOW()");
        builder.Property(r => r.ReviewedAt).HasColumnName("reviewed_at");
        builder.Property(r => r.ReviewedBy).HasColumnName("reviewed_by");

        builder.Ignore(r => r.CreatedAt);
        builder.Ignore(r => r.UpdatedAt);
        builder.Ignore(r => r.DomainEvents);

        builder.HasIndex(r => new { r.HatimId, r.UserId }).IsUnique();
        builder.HasIndex(r => new { r.HatimId, r.Status }).HasDatabaseName("idx_join_requests_hatim_status");

        builder.HasOne(r => r.Hatim)
            .WithMany(h => h.JoinRequests)
            .HasForeignKey(r => r.HatimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
