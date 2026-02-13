namespace ASideNote.Core.Entities;

public sealed class ExternalLogin
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty;      // e.g. "Google"
    public string ProviderUserId { get; set; } = string.Empty; // e.g. Google sub claim
    public string? ProviderEmail { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}
