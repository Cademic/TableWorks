using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectShowEventsOnMainCalendar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowEventsOnMainCalendar",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowEventsOnMainCalendar",
                table: "Projects");
        }
    }
}
