namespace ASideNote.Core.Entities;

public sealed class FriendRequest
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public Guid ReceiverId { get; set; }
    public FriendRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }

    public User? Requester { get; set; }
    public User? Receiver { get; set; }
}
