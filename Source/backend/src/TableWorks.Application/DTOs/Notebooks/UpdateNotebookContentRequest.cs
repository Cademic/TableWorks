using System.Text.Json.Serialization;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class UpdateNotebookContentRequest
{
    /// <summary>TipTap/ProseMirror document JSON.</summary>
    [JsonPropertyName("contentJson")]
    public string ContentJson { get; set; } = "{\"type\":\"doc\",\"content\":[]}";

    /// <summary>Optional: last known UpdatedAt (UTC) for optimistic concurrency. If provided and server UpdatedAt differs, save returns 409 Conflict.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}
