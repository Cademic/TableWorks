namespace ASideNote.Application.DTOs.Users;

public sealed class SentFriendRequestDto
{
    public Guid Id { get; set; }
    public Guid ReceiverId { get; set; }
    public string ReceiverUsername { get; set; } = string.Empty;
    public string? ReceiverProfilePictureKey { get; set; }
    public DateTime CreatedAt { get; set; }
}
