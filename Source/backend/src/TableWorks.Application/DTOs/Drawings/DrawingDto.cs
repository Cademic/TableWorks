namespace ASideNote.Application.DTOs.Drawings;

public sealed class DrawingDto
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string CanvasJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
