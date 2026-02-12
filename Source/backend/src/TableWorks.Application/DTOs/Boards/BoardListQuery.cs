using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Boards;

public sealed class BoardListQuery : PaginationRequest
{
    public string? BoardType { get; set; }
    public Guid? ProjectId { get; set; }
    public string SortBy { get; set; } = "updatedAt";
    public string SortOrder { get; set; } = "desc";
}
