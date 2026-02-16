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

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "NotebookPages",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

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

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "NotebookPages");
        }
    }
}
