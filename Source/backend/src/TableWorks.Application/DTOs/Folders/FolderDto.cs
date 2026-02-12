namespace ASideNote.Application.DTOs.Folders;

public sealed class FolderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
    public int NoteCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
