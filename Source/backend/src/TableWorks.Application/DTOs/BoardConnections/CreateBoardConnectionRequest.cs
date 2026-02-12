namespace ASideNote.Application.DTOs.BoardConnections;

public sealed class CreateBoardConnectionRequest
{
    public string FromItemId { get; set; } = string.Empty;
    public string ToItemId { get; set; } = string.Empty;
    public Guid? BoardId { get; set; }
}
