using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TableWorks.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BoardId",
                table: "Notes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BoardId",
                table: "IndexCards",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BoardId",
                table: "BoardConnections",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Boards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    BoardType = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boards_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notes_BoardId",
                table: "Notes",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_BoardId",
                table: "IndexCards",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardConnections_BoardId",
                table: "BoardConnections",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_Boards_BoardType",
                table: "Boards",
                column: "BoardType");

            migrationBuilder.CreateIndex(
                name: "IX_Boards_CreatedAt",
                table: "Boards",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Boards_UserId",
                table: "Boards",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardConnections_Boards_BoardId",
                table: "BoardConnections",
                column: "BoardId",
                principalTable: "Boards",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IndexCards_Boards_BoardId",
                table: "IndexCards",
                column: "BoardId",
                principalTable: "Boards",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notes_Boards_BoardId",
                table: "Notes",
                column: "BoardId",
                principalTable: "Boards",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardConnections_Boards_BoardId",
                table: "BoardConnections");

            migrationBuilder.DropForeignKey(
                name: "FK_IndexCards_Boards_BoardId",
                table: "IndexCards");

            migrationBuilder.DropForeignKey(
                name: "FK_Notes_Boards_BoardId",
                table: "Notes");

            migrationBuilder.DropTable(
                name: "Boards");

            migrationBuilder.DropIndex(
                name: "IX_Notes_BoardId",
                table: "Notes");

            migrationBuilder.DropIndex(
                name: "IX_IndexCards_BoardId",
                table: "IndexCards");

            migrationBuilder.DropIndex(
                name: "IX_BoardConnections_BoardId",
                table: "BoardConnections");

            migrationBuilder.DropColumn(
                name: "BoardId",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "BoardId",
                table: "IndexCards");

            migrationBuilder.DropColumn(
                name: "BoardId",
                table: "BoardConnections");
        }
    }
}
