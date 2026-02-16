namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminFriendDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public DateTime? LastLoginAt { get; set; }
}
