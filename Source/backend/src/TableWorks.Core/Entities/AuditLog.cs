namespace TableWorks.Core.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? DetailsJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }

    public User? User { get; set; }
}
