using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminUserListQuery : PaginationRequest
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
