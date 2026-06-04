using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class HatimCategoryConfiguration : IEntityTypeConfiguration<HatimCategory>
{
    public void Configure(EntityTypeBuilder<HatimCategory> builder)
    {
        builder.ToTable("hatim_categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").UseIdentityColumn();

        builder.Property(c => c.NameTr).HasColumnName("name_tr").HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.NameTr).IsUnique();

        builder.Property(c => c.NameEn).HasColumnName("name_en").HasMaxLength(100).IsRequired();
        builder.Property(c => c.Icon).HasColumnName("icon").HasMaxLength(100);
        builder.Property(c => c.IsActive).HasColumnName("is_active").HasDefaultValue(true);
    }
}
