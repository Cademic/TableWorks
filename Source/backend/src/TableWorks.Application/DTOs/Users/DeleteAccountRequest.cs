namespace ASideNote.Application.DTOs.Users;

public sealed class DeleteAccountRequest
{
    /// <summary>Optional password confirmation for accounts with a password.</summary>
    public string? Password { get; set; }
}
