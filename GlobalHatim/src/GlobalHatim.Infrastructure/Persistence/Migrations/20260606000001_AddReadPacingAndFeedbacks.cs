using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalHatim.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReadPacingAndFeedbacks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── 1. hatims tablosuna read_pacing kolonu ekle ───────────────────
            migrationBuilder.AddColumn<string>(
                name:         "read_pacing",
                table:        "hatims",
                type:         "text",
                nullable:     false,
                defaultValue: "Every2Days1Juz");

            // ── 2. feedbacks tablosunu oluştur ────────────────────────────────
            migrationBuilder.CreateTable(
                name: "feedbacks",
                columns: table => new
                {
                    id = table.Column<Guid>(
                        type: "uuid", nullable: false,
                        defaultValueSql: "gen_random_uuid()"),

                    name = table.Column<string>(
                        type: "character varying(150)", maxLength: 150, nullable: false),

                    email = table.Column<string>(
                        type: "character varying(255)", maxLength: 255, nullable: true),

                    message = table.Column<string>(
                        type: "character varying(2000)", maxLength: 2000, nullable: false),

                    user_id = table.Column<Guid>(
                        type: "uuid", nullable: true),

                    is_read = table.Column<bool>(
                        type: "boolean", nullable: false, defaultValue: false),

                    is_replied = table.Column<bool>(
                        type: "boolean", nullable: false, defaultValue: false),

                    created_at = table.Column<DateTimeOffset>(
                        type: "timestamp with time zone", nullable: false,
                        defaultValueSql: "NOW()"),

                    updated_at = table.Column<DateTimeOffset>(
                        type: "timestamp with time zone", nullable: false,
                        defaultValueSql: "NOW()"),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feedbacks", x => x.id);
                });

            // ── 3. Indexler ───────────────────────────────────────────────────
            migrationBuilder.CreateIndex(
                name:   "idx_feedbacks_user_id",
                table:  "feedbacks",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name:   "idx_feedbacks_is_read",
                table:  "feedbacks",
                column: "is_read");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "feedbacks");

            migrationBuilder.DropColumn(
                name:  "read_pacing",
                table: "hatims");
        }
    }
}
