using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASideNote.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarEventRecurrence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "CalendarEvents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceFrequency",
                table: "CalendarEvents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "CalendarEvents",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "Boards",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PinnedAt",
                table: "Boards",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceFrequency",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "PinnedAt",
                table: "Boards");
        }
    }
}
