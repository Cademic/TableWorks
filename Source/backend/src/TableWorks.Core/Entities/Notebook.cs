namespace ASideNote.Core.Entities;

public sealed class Notebook
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public DateTime? PinnedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? User { get; set; }
    public Project? Project { get; set; }
    public ICollection<NotebookPage> Pages { get; set; } = new List<NotebookPage>();
}
