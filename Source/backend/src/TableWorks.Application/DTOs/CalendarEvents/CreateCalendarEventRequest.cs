namespace ASideNote.Application.DTOs.CalendarEvents;

public sealed class CreateCalendarEventRequest
{
    public Guid? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsAllDay { get; set; } = true;
    public string Color { get; set; } = "sky";
    public string EventType { get; set; } = "Event";
}
