using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Notifications;

public sealed class NotificationListResponse
{
    public IReadOnlyList<NotificationDto> Notifications { get; set; } = Array.Empty<NotificationDto>();
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages => Limit > 0 ? (int)Math.Ceiling((double)Total / Limit) : 0;
}
