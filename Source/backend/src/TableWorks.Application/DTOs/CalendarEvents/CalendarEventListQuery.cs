namespace ASideNote.Application.DTOs.CalendarEvents;

public sealed class CalendarEventListQuery
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public Guid? ProjectId { get; set; }
}
