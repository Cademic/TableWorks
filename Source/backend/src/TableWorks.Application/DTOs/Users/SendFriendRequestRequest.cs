namespace ASideNote.Application.DTOs.Users;

public sealed class SendFriendRequestRequest
{
    public Guid ReceiverId { get; set; }
}
