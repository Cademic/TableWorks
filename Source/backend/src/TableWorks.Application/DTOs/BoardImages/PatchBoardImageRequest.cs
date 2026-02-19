namespace ASideNote.Application.DTOs.BoardImages;

public sealed class PatchBoardImageRequest
{
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public double? Rotation { get; set; }
}
