namespace TableWorks.Core.Entities;

public sealed class Note
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? FolderId { get; set; }
    public Guid? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastSavedAt { get; set; }
    public bool IsArchived { get; set; }

    public User? User { get; set; }
    public Folder? Folder { get; set; }
    public Project? Project { get; set; }
    public ICollection<NoteTag> NoteTags { get; set; } = new List<NoteTag>();
}
