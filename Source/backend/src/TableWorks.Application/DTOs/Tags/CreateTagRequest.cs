namespace TableWorks.Application.DTOs.Tags;

public sealed class CreateTagRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}
