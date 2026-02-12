using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.CalendarEvents;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class CalendarEventService : ICalendarEventService
{
    private readonly IRepository<CalendarEvent> _eventRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CalendarEventService(IRepository<CalendarEvent> eventRepo, IUnitOfWork unitOfWork)
    {
        _eventRepo = eventRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<CalendarEventDto>> GetEventsAsync(Guid userId, CalendarEventListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _eventRepo.Query()
            .Where(e => e.UserId == userId)
            .AsQueryable();

        if (query.ProjectId.HasValue)
            q = q.Where(e => e.ProjectId == query.ProjectId.Value);

        if (query.From.HasValue)
        {
            var from = query.From.Value;
            q = q.Where(e => e.StartDate >= from || (e.EndDate != null && e.EndDate >= from));
        }

        if (query.To.HasValue)
        {
            var to = query.To.Value;
            q = q.Where(e => e.StartDate <= to);
        }

        var events = await q
            .OrderBy(e => e.StartDate)
            .ThenBy(e => e.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return events.Select(MapToDto).ToList();
    }

    public async Task<CalendarEventDto> CreateEventAsync(Guid userId, CreateCalendarEventRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entity = new CalendarEvent
        {
            UserId = userId,
            ProjectId = request.ProjectId,
            Title = request.Title,
            Description = request.Description,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsAllDay = request.IsAllDay,
            Color = request.Color,
            EventType = request.EventType,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await _eventRepo.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<CalendarEventDto> GetEventByIdAsync(Guid userId, Guid eventId, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepo.Query()
            .Where(e => e.Id == eventId && e.UserId == userId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null)
            throw new KeyNotFoundException($"Calendar event {eventId} not found.");

        return MapToDto(entity);
    }

    public async Task UpdateEventAsync(Guid userId, Guid eventId, UpdateCalendarEventRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepo.Query()
            .Where(e => e.Id == eventId && e.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null)
            throw new KeyNotFoundException($"Calendar event {eventId} not found.");

        entity.Title = request.Title;
        entity.Description = request.Description;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.IsAllDay = request.IsAllDay;
        entity.Color = request.Color;
        entity.EventType = request.EventType;
        entity.UpdatedAt = DateTime.UtcNow;

        _eventRepo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteEventAsync(Guid userId, Guid eventId, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepo.Query()
            .Where(e => e.Id == eventId && e.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null)
            throw new KeyNotFoundException($"Calendar event {eventId} not found.");

        _eventRepo.Delete(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static CalendarEventDto MapToDto(CalendarEvent e)
    {
        return new CalendarEventDto
        {
            Id = e.Id,
            ProjectId = e.ProjectId,
            Title = e.Title,
            Description = e.Description,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            IsAllDay = e.IsAllDay,
            Color = e.Color,
            EventType = e.EventType,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
        };
    }
}
