namespace TableWorks.Application.DTOs.IndexCards;

public sealed class PatchIndexCardRequest
{
    public string? Title { get; set; }
    public bool PatchTitle { get; set; }
    public string? Content { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public string? Color { get; set; }
    public double? Rotation { get; set; }
}
