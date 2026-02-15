namespace ASideNote.Application.DTOs.Users;

public sealed class UserPreferencesDto
{
    public string Theme { get; set; } = "System";
    public string? EmailNotifications { get; set; }
}
