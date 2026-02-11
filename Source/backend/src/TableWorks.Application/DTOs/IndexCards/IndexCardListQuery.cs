using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.DTOs.IndexCards;

public sealed class IndexCardListQuery : PaginationRequest
{
    public Guid? FolderId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? BoardId { get; set; }
    public string? TagIds { get; set; }
    public string? Search { get; set; }
    public string SortBy { get; set; } = "updatedAt";
    public string SortOrder { get; set; } = "desc";
}
