namespace TableWorks.Application.DTOs.Notes;

public sealed class CreateNoteRequest
{
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? FolderId { get; set; }
    public Guid? ProjectId { get; set; }
    public List<Guid> TagIds { get; set; } = new();
}
