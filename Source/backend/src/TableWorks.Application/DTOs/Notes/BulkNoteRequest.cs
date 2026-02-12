namespace ASideNote.Application.DTOs.Notes;

public sealed class BulkNoteRequest
{
    public List<Guid> NoteIds { get; set; } = new();
    public string Action { get; set; } = string.Empty; // delete | move | tag
    public Guid? FolderId { get; set; }
    public List<Guid>? TagIds { get; set; }
}
