namespace TableWorks.Core.Entities;

public sealed class Drawing
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public string CanvasJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Board? Board { get; set; }
    public User? User { get; set; }
}
