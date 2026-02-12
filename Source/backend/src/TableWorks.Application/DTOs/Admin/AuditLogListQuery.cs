using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Admin;

public sealed class AuditLogListQuery : PaginationRequest
{
    public Guid? UserId { get; set; }
    public string? ActionType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
