namespace ASideNote.Core.Entities;

public sealed class CalendarEvent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsAllDay { get; set; } = true;
    public string Color { get; set; } = "sky";
    public string EventType { get; set; } = "Event";

    // Recurrence fields (simple pattern)
    public string? RecurrenceFrequency { get; set; }   // "Daily" | "Weekly" | "Monthly" | null
    public int RecurrenceInterval { get; set; } = 1;    // Every N days/weeks/months
    public DateTime? RecurrenceEndDate { get; set; }    // Optional end date for recurrence

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? User { get; set; }
    public Project? Project { get; set; }
}
