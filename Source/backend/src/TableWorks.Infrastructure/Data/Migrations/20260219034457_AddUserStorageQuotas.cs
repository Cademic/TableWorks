using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserStorageQuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "StorageLimitBytes",
                table: "Users",
                type: "bigint",
                nullable: false,
                defaultValue: 524288000L);

            migrationBuilder.AddColumn<long>(
                name: "StorageUsedBytes",
                table: "Users",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "UserStorageItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserStorageItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserStorageItems_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserStorageItems_StorageKey",
                table: "UserStorageItems",
                column: "StorageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserStorageItems_UserId",
                table: "UserStorageItems",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserStorageItems");

            migrationBuilder.DropColumn(
                name: "StorageLimitBytes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StorageUsedBytes",
                table: "Users");
        }
    }
}
