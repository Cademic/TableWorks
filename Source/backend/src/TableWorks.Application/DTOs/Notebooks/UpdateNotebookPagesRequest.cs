using System.Text.Json.Serialization;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class UpdateNotebookPagesRequest
{
    /// <summary>Page contents in order; index 0 = page 1. Max 999 items.</summary>
    [JsonPropertyName("pages")]
    public IReadOnlyList<string> Pages { get; set; } = Array.Empty<string>();
}
