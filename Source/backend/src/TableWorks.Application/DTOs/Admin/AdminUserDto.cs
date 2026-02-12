namespace ASideNote.Application.DTOs.Admin;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public AdminUserStatsDto Stats { get; set; } = new();
}

public sealed class AdminUserStatsDto
{
    public int NoteCount { get; set; }
    public int ProjectCount { get; set; }
}
