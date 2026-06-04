using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class UserLevelConfiguration : IEntityTypeConfiguration<UserLevel>
{
    public void Configure(EntityTypeBuilder<UserLevel> builder)
    {
        builder.ToTable("user_levels");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(l => l.NameTr).HasColumnName("name_tr").HasMaxLength(50).IsRequired();
        builder.HasIndex(l => l.NameTr).IsUnique();

        builder.Property(l => l.NameEn).HasColumnName("name_en").HasMaxLength(50).IsRequired();
        builder.Property(l => l.MinJuzRead).HasColumnName("min_juz_read").HasDefaultValue(0);
        builder.Property(l => l.BadgeIcon).HasColumnName("badge_icon").HasMaxLength(255);
        builder.Property(l => l.SortOrder).HasColumnName("sort_order").HasDefaultValue((short)0);

        builder.Ignore(l => l.DomainEvents);
    }
}
