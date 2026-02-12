using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Notifications;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _notifRepo;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IRepository<Notification> notifRepo, IUnitOfWork unitOfWork)
    {
        _notifRepo = notifRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<NotificationListResponse> GetNotificationsAsync(Guid userId, NotificationListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _notifRepo.Query()
            .Where(n => n.UserId == userId)
            .AsQueryable();

        if (query.IsRead.HasValue)
            q = q.Where(n => n.IsRead == query.IsRead.Value);

        if (!string.IsNullOrWhiteSpace(query.Type))
            q = q.Where(n => n.Type == query.Type);

        var total = await q.CountAsync(cancellationToken);
        var unreadCount = await _notifRepo.Query()
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

        var notifications = await q
            .OrderByDescending(n => n.CreatedAt)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return new NotificationListResponse
        {
            Notifications = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                RelatedEntityType = n.RelatedEntityType,
                RelatedEntityId = n.RelatedEntityId,
                CreatedAt = n.CreatedAt
            }).ToList(),
            UnreadCount = unreadCount,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notif = await _notifRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        notif.IsRead = true;
        _notifRepo.Update(notif);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var unread = await _notifRepo.Query()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notif in unread)
        {
            notif.IsRead = true;
            _notifRepo.Update(notif);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteNotificationAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notif = await _notifRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        _notifRepo.Delete(notif);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
