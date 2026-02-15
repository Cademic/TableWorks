namespace ASideNote.Application.DTOs.Notebooks;

public sealed class NotebookDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public DateTime? PinnedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    /// <summary>Page contents in order; index 0 = page 1.</summary>
    public IReadOnlyList<string> Pages { get; set; } = Array.Empty<string>();
}
