namespace ASideNote.Application.DTOs.Users;

public sealed class FriendDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? ProfilePictureKey { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
