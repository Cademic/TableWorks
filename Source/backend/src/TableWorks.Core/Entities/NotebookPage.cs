namespace ASideNote.Core.Entities;

public sealed class NotebookPage
{
    public Guid Id { get; set; }
    public Guid NotebookId { get; set; }
    /// <summary>Zero-based page index; max 998 (999 pages total).</summary>
    public int PageIndex { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Notebook? Notebook { get; set; }
}
