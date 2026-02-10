namespace TableWorks.Core.Entities;

public sealed class Project
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Progress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? Owner { get; set; }
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
}
