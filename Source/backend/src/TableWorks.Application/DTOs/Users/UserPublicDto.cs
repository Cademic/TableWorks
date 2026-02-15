namespace ASideNote.Application.DTOs.Users;

public sealed class UserPublicDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? ProfilePictureKey { get; set; }
    public string? Bio { get; set; }
}
