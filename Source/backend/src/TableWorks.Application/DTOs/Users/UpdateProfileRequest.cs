namespace ASideNote.Application.DTOs.Users;

public sealed class UpdateProfileRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
