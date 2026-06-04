using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GlobalHatim.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:hatim_status.hatim_status", "draft,active,completed,archived")
                .Annotation("Npgsql:Enum:join_request_status.join_request_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:juz_allocation_status.juz_allocation_status", "available,assigned,completed")
                .Annotation("Npgsql:Enum:participant_role.participant_role", "manager,reader")
                .Annotation("Npgsql:Enum:plan_type.plan_type", "every2days1juz,weekly_no_accel,long_term_hybrid");

            migrationBuilder.CreateTable(
                name: "contact_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email_or_phone = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    message = table.Column<string>(type: "text", nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_replied = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_messages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "hatim_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name_tr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name_en = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hatim_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "juz_lookup",
                columns: table => new
                {
                    juz_number = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    start_page = table.Column<short>(type: "smallint", nullable: false),
                    end_page = table.Column<short>(type: "smallint", nullable: false),
                    associated_surah_names_tr = table.Column<string>(type: "text", nullable: false),
                    associated_surah_names_ar = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_juz_lookup", x => x.juz_number);
                    table.CheckConstraint("chk_juz_number_range", "juz_number BETWEEN 1 AND 30");
                });

            migrationBuilder.CreateTable(
                name: "user_levels",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name_tr = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name_en = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    min_juz_read = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    badge_icon = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_levels", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    level_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_login_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_users_user_levels_level_id",
                        column: x => x.level_id,
                        principalTable: "user_levels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "hatims",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    creator_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<int>(type: "integer", nullable: true),
                    plan_type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "Draft"),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    invite_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    current_cycle = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    total_cycles = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hatims", x => x.id);
                    table.ForeignKey(
                        name: "FK_hatims_hatim_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "hatim_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_hatims_users_creator_user_id",
                        column: x => x.creator_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    notification_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "tr"),
                    theme = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "dark"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_settings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_stats",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    total_juz_read = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_hatims_joined = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_hatims_completed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_hatims_created = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_stats", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_stats_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hatim_join_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    hatim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "Pending"),
                    requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hatim_join_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_hatim_join_requests_hatims_hatim_id",
                        column: x => x.hatim_id,
                        principalTable: "hatims",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_hatim_join_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hatim_participants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    hatim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false, defaultValue: "Reader"),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hatim_participants", x => x.id);
                    table.ForeignKey(
                        name: "FK_hatim_participants_hatims_hatim_id",
                        column: x => x.hatim_id,
                        principalTable: "hatims",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_hatim_participants_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "juz_allocations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    hatim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cycle_number = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    juz_number = table.Column<short>(type: "smallint", nullable: false),
                    assigned_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    guest_first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    guest_last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    guest_token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "Available"),
                    assigned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deadline_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_juz_allocations", x => x.id);
                    table.CheckConstraint("chk_single_assignee", "(assigned_user_id IS NOT NULL AND guest_first_name IS NULL AND guest_token IS NULL)\n              OR (assigned_user_id IS NULL AND guest_first_name IS NOT NULL AND guest_token IS NOT NULL)\n              OR (assigned_user_id IS NULL AND guest_first_name IS NULL AND guest_token IS NULL)");
                    table.ForeignKey(
                        name: "FK_juz_allocations_hatims_hatim_id",
                        column: x => x.hatim_id,
                        principalTable: "hatims",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_juz_allocations_juz_lookup_juz_number",
                        column: x => x.juz_number,
                        principalTable: "juz_lookup",
                        principalColumn: "juz_number",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_juz_allocations_users_assigned_user_id",
                        column: x => x.assigned_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "rotation_schedule",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    hatim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cycle_number = table.Column<int>(type: "integer", nullable: false),
                    scheduled_date = table.Column<DateOnly>(type: "date", nullable: false),
                    is_ramadan_period = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    actual_rotation_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rotation_schedule", x => x.id);
                    table.ForeignKey(
                        name: "FK_rotation_schedule_hatims_hatim_id",
                        column: x => x.hatim_id,
                        principalTable: "hatims",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reading_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    hatim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allocation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    juz_number = table.Column<short>(type: "smallint", nullable: false),
                    cycle_number = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reading_log", x => x.id);
                    table.ForeignKey(
                        name: "FK_reading_log_hatims_hatim_id",
                        column: x => x.hatim_id,
                        principalTable: "hatims",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_reading_log_juz_allocations_allocation_id",
                        column: x => x.allocation_id,
                        principalTable: "juz_allocations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reading_log_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_hatim_categories_name_tr",
                table: "hatim_categories",
                column: "name_tr",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_hatim_join_requests_hatim_id_user_id",
                table: "hatim_join_requests",
                columns: new[] { "hatim_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_hatim_join_requests_user_id",
                table: "hatim_join_requests",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_join_requests_hatim_status",
                table: "hatim_join_requests",
                columns: new[] { "hatim_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_hatim_participants_hatim_id_user_id",
                table: "hatim_participants",
                columns: new[] { "hatim_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_participants_user",
                table: "hatim_participants",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_hatims_category_id",
                table: "hatims",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_hatims_invite_code",
                table: "hatims",
                column: "invite_code",
                unique: true,
                filter: "invite_code IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_hatims_creator",
                table: "hatims",
                column: "creator_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_hatims_is_public",
                table: "hatims",
                column: "is_public");

            migrationBuilder.CreateIndex(
                name: "idx_hatims_plan_type",
                table: "hatims",
                column: "plan_type");

            migrationBuilder.CreateIndex(
                name: "idx_hatims_status",
                table: "hatims",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_juz_allocations_hatim_id_cycle_number_juz_number",
                table: "juz_allocations",
                columns: new[] { "hatim_id", "cycle_number", "juz_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_juz_allocations_juz_number",
                table: "juz_allocations",
                column: "juz_number");

            migrationBuilder.CreateIndex(
                name: "idx_juz_alloc_guest_token",
                table: "juz_allocations",
                column: "guest_token",
                unique: true,
                filter: "guest_token IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_juz_alloc_hatim_status",
                table: "juz_allocations",
                columns: new[] { "hatim_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_juz_alloc_user",
                table: "juz_allocations",
                column: "assigned_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_log_allocation_id",
                table: "reading_log",
                column: "allocation_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_reading_log_confirmed",
                table: "reading_log",
                column: "confirmed_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "idx_reading_log_hatim",
                table: "reading_log",
                column: "hatim_id");

            migrationBuilder.CreateIndex(
                name: "idx_reading_log_user",
                table: "reading_log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_rotation_schedule_hatim_id_cycle_number",
                table: "rotation_schedule",
                columns: new[] { "hatim_id", "cycle_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_levels_name_tr",
                table: "user_levels",
                column: "name_tr",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_level_id",
                table: "users",
                column: "level_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contact_messages");

            migrationBuilder.DropTable(
                name: "hatim_join_requests");

            migrationBuilder.DropTable(
                name: "hatim_participants");

            migrationBuilder.DropTable(
                name: "reading_log");

            migrationBuilder.DropTable(
                name: "rotation_schedule");

            migrationBuilder.DropTable(
                name: "user_settings");

            migrationBuilder.DropTable(
                name: "user_stats");

            migrationBuilder.DropTable(
                name: "juz_allocations");

            migrationBuilder.DropTable(
                name: "hatims");

            migrationBuilder.DropTable(
                name: "juz_lookup");

            migrationBuilder.DropTable(
                name: "hatim_categories");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "user_levels");
        }
    }
}
