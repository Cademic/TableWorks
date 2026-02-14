namespace ASideNote.Core.Entities;

public sealed class UserPinnedProject
{
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime PinnedAt { get; set; }

    public User? User { get; set; }
    public Project? Project { get; set; }
}
