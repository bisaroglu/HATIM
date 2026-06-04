using GlobalHatim.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class JuzLookupConfiguration : IEntityTypeConfiguration<JuzLookup>
{
    public void Configure(EntityTypeBuilder<JuzLookup> builder)
    {
        builder.ToTable("juz_lookup");

        builder.HasKey(j => j.JuzNumber);
        builder.Property(j => j.JuzNumber)
            .HasColumnName("juz_number")
            .HasColumnType("smallint");

        builder.ToTable(t => t.HasCheckConstraint(
            "chk_juz_number_range",
            "juz_number BETWEEN 1 AND 30"));

        builder.Property(j => j.StartPage)
            .HasColumnName("start_page")
            .HasColumnType("smallint")
            .IsRequired();

        builder.Property(j => j.EndPage)
            .HasColumnName("end_page")
            .HasColumnType("smallint")
            .IsRequired();

        builder.Property(j => j.AssociatedSurahNamesTr)
            .HasColumnName("associated_surah_names_tr")
            .IsRequired();

        builder.Property(j => j.AssociatedSurahNamesAr)
            .HasColumnName("associated_surah_names_ar")
            .IsRequired();
    }
}
