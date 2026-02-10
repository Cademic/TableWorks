namespace TableWorks.Application.DTOs.Projects;

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Progress { get; set; }
    public Guid OwnerId { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
