using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TableWorks.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteSizeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Height",
                table: "Notes",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "Notes",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Height",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "Notes");
        }
    }
}
