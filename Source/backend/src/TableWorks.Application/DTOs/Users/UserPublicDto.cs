namespace ASideNote.Application.DTOs.Users;

public sealed class UserPublicDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? ProfilePictureKey { get; set; }
    public string? Bio { get; set; }
    /// <summary>Profile stats shown as sticky notes (member since, last login, friends, role).</summary>
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FriendCount { get; set; }
    public string? Role { get; set; }
}
