using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.DTOs.Admin;

public sealed class AdminUserListQuery : PaginationRequest
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
