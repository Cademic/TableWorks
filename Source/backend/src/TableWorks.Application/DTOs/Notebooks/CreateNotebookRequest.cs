namespace ASideNote.Application.DTOs.Notebooks;

public sealed class CreateNotebookRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
}
