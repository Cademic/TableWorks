namespace TableWorks.Application.DTOs.Tags;

public sealed class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int NoteCount { get; set; }
}
