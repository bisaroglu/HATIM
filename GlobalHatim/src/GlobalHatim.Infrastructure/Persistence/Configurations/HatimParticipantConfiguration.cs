using GlobalHatim.Domain.Entities;
using GlobalHatim.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GlobalHatim.Infrastructure.Persistence.Configurations;

public sealed class HatimParticipantConfiguration : IEntityTypeConfiguration<HatimParticipant>
{
    public void Configure(EntityTypeBuilder<HatimParticipant> builder)
    {
        builder.ToTable("hatim_participants");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(p => p.HatimId).HasColumnName("hatim_id").IsRequired();
        builder.Property(p => p.UserId).HasColumnName("user_id").IsRequired();

        builder.Property(p => p.Role)
            .HasColumnName("role")
            .HasConversion<string>()
            .HasDefaultValue(ParticipantRole.Reader);

        builder.Property(p => p.JoinedAt).HasColumnName("joined_at").HasDefaultValueSql("NOW()");

        builder.Ignore(p => p.CreatedAt);
        builder.Ignore(p => p.UpdatedAt);
        builder.Ignore(p => p.DomainEvents);

        builder.HasIndex(p => new { p.HatimId, p.UserId }).IsUnique();
        builder.HasIndex(p => p.UserId).HasDatabaseName("idx_participants_user");

        builder.HasOne(p => p.Hatim)
            .WithMany(h => h.Participants)
            .HasForeignKey(p => p.HatimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany(u => u.Participations)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
