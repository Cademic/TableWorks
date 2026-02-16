using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotebookProjectId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "Notebooks",
                type: "uuid",
                nullable: true);

            // Idempotent: column may already exist (e.g. from create-notebooks-tables script or prior migration)
            migrationBuilder.Sql(@"
                ALTER TABLE ""NotebookPages""
                ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_ProjectId",
                table: "Notebooks",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notebooks_Projects_ProjectId",
                table: "Notebooks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notebooks_Projects_ProjectId",
                table: "Notebooks");

            migrationBuilder.DropIndex(
                name: "IX_Notebooks_ProjectId",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Notebooks");

            // Only drop if we own the column (e.g. we added it in this migration); avoid failing if it was created elsewhere
            migrationBuilder.Sql(@"
                ALTER TABLE ""NotebookPages"" DROP COLUMN IF EXISTS ""CreatedAt"";
            ");
        }
    }
}
