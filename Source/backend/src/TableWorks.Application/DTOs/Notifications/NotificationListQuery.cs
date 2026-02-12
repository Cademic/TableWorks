using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Notifications;

public sealed class NotificationListQuery : PaginationRequest
{
    public bool? IsRead { get; set; }
    public string? Type { get; set; }
}
