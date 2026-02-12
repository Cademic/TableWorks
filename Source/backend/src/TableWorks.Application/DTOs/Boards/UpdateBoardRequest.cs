namespace ASideNote.Application.DTOs.Boards;

public sealed class UpdateBoardRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
