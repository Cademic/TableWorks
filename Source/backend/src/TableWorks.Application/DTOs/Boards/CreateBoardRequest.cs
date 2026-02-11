namespace TableWorks.Application.DTOs.Boards;

public sealed class CreateBoardRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BoardType { get; set; } = "NoteBoard";
}
