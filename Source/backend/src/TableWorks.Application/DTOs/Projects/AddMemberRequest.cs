namespace ASideNote.Application.DTOs.Projects;

public sealed class AddMemberRequest
{
    /// <summary>Email of the user to add. Optional if <see cref="UserId"/> is set.</summary>
    public string? Email { get; set; }

    /// <summary>Id of the user to add (e.g. from friends list). Optional if <see cref="Email"/> is set.</summary>
    public Guid? UserId { get; set; }

    public string Role { get; set; } = "Viewer";
}
