using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminNoteListQuery : PaginationRequest
{
    public Guid? UserId { get; set; }
    public string? Search { get; set; }
}
