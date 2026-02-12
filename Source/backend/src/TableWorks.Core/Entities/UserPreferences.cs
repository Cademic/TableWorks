namespace ASideNote.Core.Entities;

public sealed class UserPreferences
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Theme { get; set; } = "System";
    public string? EmailNotificationsJson { get; set; }
    public int AutoSaveInterval { get; set; } = 2;
    public string DefaultView { get; set; } = "Table";
    public DateTime UpdatedAt { get; set; }

    public User? User { get; set; }
}
