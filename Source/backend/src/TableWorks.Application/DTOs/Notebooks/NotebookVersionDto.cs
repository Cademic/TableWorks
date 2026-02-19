using System.Text.Json.Serialization;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class NotebookVersionDto
{
    public Guid Id { get; set; }
    public Guid NotebookId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Label { get; set; }
    /// <summary>TipTap/ProseMirror document JSON at time of snapshot. Omitted from list; included when fetching a single version.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ContentJson { get; set; }
}
