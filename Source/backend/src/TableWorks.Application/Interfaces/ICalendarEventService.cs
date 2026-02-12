using ASideNote.Application.DTOs.CalendarEvents;

namespace ASideNote.Application.Interfaces;

public interface ICalendarEventService
{
    Task<IReadOnlyList<CalendarEventDto>> GetEventsAsync(Guid userId, CalendarEventListQuery query, CancellationToken cancellationToken = default);
    Task<CalendarEventDto> CreateEventAsync(Guid userId, CreateCalendarEventRequest request, CancellationToken cancellationToken = default);
    Task<CalendarEventDto> GetEventByIdAsync(Guid userId, Guid eventId, CancellationToken cancellationToken = default);
    Task UpdateEventAsync(Guid userId, Guid eventId, UpdateCalendarEventRequest request, CancellationToken cancellationToken = default);
    Task DeleteEventAsync(Guid userId, Guid eventId, CancellationToken cancellationToken = default);
}
