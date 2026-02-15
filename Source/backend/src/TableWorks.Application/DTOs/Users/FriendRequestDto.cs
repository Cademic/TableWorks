namespace ASideNote.Application.DTOs.Users;

public sealed class FriendRequestDto
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public string RequesterUsername { get; set; } = string.Empty;
    public string? RequesterProfilePictureKey { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Status { get; set; }
}
