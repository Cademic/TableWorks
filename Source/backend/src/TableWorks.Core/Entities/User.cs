namespace ASideNote.Core.Entities;

public sealed class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Email verification
    public bool IsEmailVerified { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    public UserPreferences? Preferences { get; set; }
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<IndexCard> IndexCards { get; set; } = new List<IndexCard>();
    public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public ICollection<Folder> Folders { get; set; } = new List<Folder>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<BoardConnection> BoardConnections { get; set; } = new List<BoardConnection>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
    public ICollection<Drawing> Drawings { get; set; } = new List<Drawing>();
    public ICollection<CalendarEvent> CalendarEvents { get; set; } = new List<CalendarEvent>();
    public ICollection<ExternalLogin> ExternalLogins { get; set; } = new List<ExternalLogin>();
}
