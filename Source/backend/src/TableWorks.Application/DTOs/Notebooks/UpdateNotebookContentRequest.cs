using System.Text.Json.Serialization;

namespace ASideNote.Application.DTOs.Notebooks;

public sealed class UpdateNotebookContentRequest
{
    /// <summary>TipTap/ProseMirror document JSON.</summary>
    [JsonPropertyName("contentJson")]
    public string ContentJson { get; set; } = "{\"type\":\"doc\",\"content\":[]}";
}
