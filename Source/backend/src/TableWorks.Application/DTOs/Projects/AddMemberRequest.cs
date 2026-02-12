namespace ASideNote.Application.DTOs.Projects;

public sealed class AddMemberRequest
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer";
}
