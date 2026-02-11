namespace TableWorks.Core.Entities;

public sealed class BoardConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FromItemId { get; set; } = string.Empty;
    public string ToItemId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}
