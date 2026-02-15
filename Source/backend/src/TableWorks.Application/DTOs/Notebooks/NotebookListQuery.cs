using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class NotebookListQuery : PaginationRequest
{
    public string SortBy { get; set; } = "updatedAt";
    public string SortOrder { get; set; } = "desc";
}
