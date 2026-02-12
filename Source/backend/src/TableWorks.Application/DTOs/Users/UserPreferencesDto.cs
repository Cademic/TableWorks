namespace ASideNote.Application.DTOs.Users;

public sealed class UserPreferencesDto
{
    public string Theme { get; set; } = "System";
    public string? EmailNotifications { get; set; }
    public int AutoSaveInterval { get; set; } = 2;
    public string DefaultView { get; set; } = "Table";
}
