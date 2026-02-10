using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.DTOs.Notifications;

public sealed class NotificationListQuery : PaginationRequest
{
    public bool? IsRead { get; set; }
    public string? Type { get; set; }
}
