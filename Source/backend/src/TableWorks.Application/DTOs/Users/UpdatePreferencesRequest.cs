namespace ASideNote.Application.DTOs.Users;

public sealed class UpdatePreferencesRequest
{
    public string Theme { get; set; } = "System";
    public int AutoSaveInterval { get; set; } = 2;
    public string DefaultView { get; set; } = "Table";
}
