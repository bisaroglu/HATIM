using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.ToTable("user_settings");

        builder.HasKey(s => s.UserId);
        builder.Property(s => s.UserId).HasColumnName("user_id");

        builder.Property(s => s.NotificationEnabled)
            .HasColumnName("notification_enabled").HasDefaultValue(true);
        builder.Property(s => s.Language)
            .HasColumnName("language").HasMaxLength(10).HasDefaultValue("tr");
        builder.Property(s => s.Theme)
            .HasColumnName("theme").HasMaxLength(10).HasDefaultValue("dark");
        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at").HasDefaultValueSql("NOW()");
    }
}
