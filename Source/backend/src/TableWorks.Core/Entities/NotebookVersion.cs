namespace ASideNote.Core.Entities;

/// <summary>Snapshot of a notebook's content for version history and restore.</summary>
public sealed class NotebookVersion
{
    public Guid Id { get; set; }
    public Guid NotebookId { get; set; }
    /// <summary>TipTap/ProseMirror document JSON at time of snapshot.</summary>
    public string ContentJson { get; set; } = "{\"type\":\"doc\",\"content\":[]}";
    public DateTime CreatedAt { get; set; }
    /// <summary>Optional label (e.g. "Before major edit").</summary>
    public string? Label { get; set; }

    public Notebook? Notebook { get; set; }
}
