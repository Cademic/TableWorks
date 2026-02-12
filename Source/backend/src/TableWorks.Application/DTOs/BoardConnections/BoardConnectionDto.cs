namespace ASideNote.Application.DTOs.BoardConnections;

public sealed class BoardConnectionDto
{
    public Guid Id { get; set; }
    public string FromItemId { get; set; } = string.Empty;
    public string ToItemId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
