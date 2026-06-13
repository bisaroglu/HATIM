using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("feedbacks");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(f => f.Name)
            .HasColumnName("name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(f => f.Email)
            .HasColumnName("email")
            .HasMaxLength(255);

        builder.Property(f => f.Message)
            .HasColumnName("message")
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(f => f.UserId)
            .HasColumnName("user_id");

        builder.Property(f => f.IsRead)
            .HasColumnName("is_read")
            .HasDefaultValue(false);

        builder.Property(f => f.IsReplied)
            .HasColumnName("is_replied")
            .HasDefaultValue(false);

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        builder.Ignore(f => f.DomainEvents);

        builder.HasIndex(f => f.UserId).HasDatabaseName("idx_feedbacks_user_id");
        builder.HasIndex(f => f.IsRead).HasDatabaseName("idx_feedbacks_is_read");
    }
}
