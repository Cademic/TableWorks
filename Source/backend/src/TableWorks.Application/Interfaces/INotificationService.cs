using TableWorks.Application.DTOs.Common;
using TableWorks.Application.DTOs.Notifications;

namespace TableWorks.Application.Interfaces;

public interface INotificationService
{
    Task<NotificationListResponse> GetNotificationsAsync(Guid userId, NotificationListQuery query, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DeleteNotificationAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
}
