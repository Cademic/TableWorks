namespace ASideNote.Core.Entities;

public sealed class BoardConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FromItemId { get; set; } = string.Empty;
    public string ToItemId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? BoardId { get; set; }

    public User? User { get; set; }
    public Board? Board { get; set; }
}
