namespace TableWorks.Application.DTOs.Admin;

public sealed class AdminNoteDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
