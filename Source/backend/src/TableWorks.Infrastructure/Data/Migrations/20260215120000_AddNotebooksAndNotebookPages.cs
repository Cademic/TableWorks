using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [Migration("20260215120000_AddNotebooksAndNotebookPages")]
    public partial class AddNotebooksAndNotebookPages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notebooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    PinnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notebooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notebooks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotebookPages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    NotebookId = table.Column<Guid>(type: "uuid", nullable: false),
                    PageIndex = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotebookPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotebookPages_Notebooks_NotebookId",
                        column: x => x.NotebookId,
                        principalTable: "Notebooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_NotebookId",
                table: "NotebookPages",
                column: "NotebookId");

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_NotebookId_PageIndex",
                table: "NotebookPages",
                columns: new[] { "NotebookId", "PageIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_CreatedAt",
                table: "Notebooks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_UpdatedAt",
                table: "Notebooks",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_UserId",
                table: "Notebooks",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "NotebookPages");
            migrationBuilder.DropTable(name: "Notebooks");
        }
    }
}
