using TableWorks.Application.DTOs.Tags;

namespace TableWorks.Application.DTOs.IndexCards;

public sealed class IndexCardSummaryDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? FolderId { get; set; }
    public Guid? ProjectId { get; set; }
    public IReadOnlyList<TagDto> Tags { get; set; } = Array.Empty<TagDto>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public string? Color { get; set; }
    public double? Rotation { get; set; }
}
