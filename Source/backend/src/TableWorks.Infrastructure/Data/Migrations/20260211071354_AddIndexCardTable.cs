using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TableWorks.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexCardTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IndexCards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    FolderId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSavedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    PositionX = table.Column<double>(type: "double precision", nullable: true),
                    PositionY = table.Column<double>(type: "double precision", nullable: true),
                    Width = table.Column<double>(type: "double precision", nullable: true),
                    Height = table.Column<double>(type: "double precision", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    Rotation = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IndexCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IndexCards_Folders_FolderId",
                        column: x => x.FolderId,
                        principalTable: "Folders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_IndexCards_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_IndexCards_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IndexCardTags",
                columns: table => new
                {
                    IndexCardId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IndexCardTags", x => new { x.IndexCardId, x.TagId });
                    table.ForeignKey(
                        name: "FK_IndexCardTags_IndexCards_IndexCardId",
                        column: x => x.IndexCardId,
                        principalTable: "IndexCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IndexCardTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_CreatedAt",
                table: "IndexCards",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_FolderId",
                table: "IndexCards",
                column: "FolderId");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_ProjectId",
                table: "IndexCards",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_UpdatedAt",
                table: "IndexCards",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCards_UserId",
                table: "IndexCards",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IndexCardTags_TagId",
                table: "IndexCardTags",
                column: "TagId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IndexCardTags");

            migrationBuilder.DropTable(
                name: "IndexCards");
        }
    }
}
