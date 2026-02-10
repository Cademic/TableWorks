using TableWorks.Application.DTOs.Notes;

namespace TableWorks.Application.DTOs.Projects;

public sealed class ProjectDetailDto
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
    public DateTime CreatedAt { get; set; }
    public IReadOnlyList<ProjectMemberDto> Members { get; set; } = Array.Empty<ProjectMemberDto>();
    public IReadOnlyList<NoteSummaryDto> Notes { get; set; } = Array.Empty<NoteSummaryDto>();
}
