using TableWorks.Application.DTOs.Tags;

namespace TableWorks.Application.DTOs.Notes;

public class NoteSummaryDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? ProjectId { get; set; }
    public IReadOnlyList<TagDto> Tags { get; set; } = Array.Empty<TagDto>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
