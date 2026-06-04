using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Email)
            .HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasColumnName("password_hash").HasMaxLength(500).IsRequired();

        builder.Property(u => u.FirstName)
            .HasColumnName("first_name").HasMaxLength(100).IsRequired();

        builder.Property(u => u.LastName)
            .HasColumnName("last_name").HasMaxLength(100).IsRequired();

        builder.Property(u => u.AvatarUrl)
            .HasColumnName("avatar_url").HasMaxLength(500);

        builder.Property(u => u.LevelId).HasColumnName("level_id").HasColumnType("uuid");
        builder.Property(u => u.IsActive).HasColumnName("is_active").HasDefaultValue(true);

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at").HasDefaultValueSql("NOW()");
        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at").HasDefaultValueSql("NOW()");
        builder.Property(u => u.LastLoginAt).HasColumnName("last_login_at");

        // Navigation ignore — domain events not persisted
        builder.Ignore(u => u.DomainEvents);

        builder.HasOne(u => u.Level)
            .WithMany(l => l.Users)
            .HasForeignKey(u => u.LevelId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(u => u.Stats)
            .WithOne(s => s.User)
            .HasForeignKey<UserStats>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.Settings)
            .WithOne(s => s.User)
            .HasForeignKey<UserSettings>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
