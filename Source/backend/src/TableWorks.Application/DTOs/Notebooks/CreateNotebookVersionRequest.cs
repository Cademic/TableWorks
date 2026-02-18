using System.Text.Json.Serialization;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class CreateNotebookVersionRequest
{
    /// <summary>Optional label (e.g. "Before major edit").</summary>
    [JsonPropertyName("label")]
    public string? Label { get; set; }
}
