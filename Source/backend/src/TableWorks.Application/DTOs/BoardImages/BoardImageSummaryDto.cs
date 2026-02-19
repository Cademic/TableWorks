namespace ASideNote.Application.DTOs.BoardImages;

public sealed class BoardImageSummaryDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public double? Rotation { get; set; }
}
