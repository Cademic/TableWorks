using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.DTOs.Admin;

public sealed class AdminNoteListQuery : PaginationRequest
{
    public Guid? UserId { get; set; }
    public string? Search { get; set; }
}
