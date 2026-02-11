using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.DTOs.Boards;

public sealed class BoardListQuery : PaginationRequest
{
    public string? BoardType { get; set; }
    public string SortBy { get; set; } = "updatedAt";
    public string SortOrder { get; set; } = "desc";
}
