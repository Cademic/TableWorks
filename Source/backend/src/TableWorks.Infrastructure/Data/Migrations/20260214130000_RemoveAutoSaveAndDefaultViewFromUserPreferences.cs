using ASideNote.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260214130000_RemoveAutoSaveAndDefaultViewFromUserPreferences")]
    public partial class RemoveAutoSaveAndDefaultViewFromUserPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF EXISTS so migration succeeds when columns were already dropped (e.g. manual or prior run)
            migrationBuilder.Sql(@"ALTER TABLE ""UserPreferences"" DROP COLUMN IF EXISTS ""AutoSaveInterval"";");
            migrationBuilder.Sql(@"ALTER TABLE ""UserPreferences"" DROP COLUMN IF EXISTS ""DefaultView"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AutoSaveInterval",
                table: "UserPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<string>(
                name: "DefaultView",
                table: "UserPreferences",
                type: "text",
                nullable: false,
                defaultValue: "Table");
        }
    }
}
