using ASideNote.Application.DTOs.Notes;
using ASideNote.Application.DTOs.Projects;

namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminUserDetailDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public AdminUserStatsDto Stats { get; set; } = new();
    public IReadOnlyList<NoteSummaryDto> Notes { get; set; } = Array.Empty<NoteSummaryDto>();
    public IReadOnlyList<ProjectSummaryDto> Projects { get; set; } = Array.Empty<ProjectSummaryDto>();
    public IReadOnlyList<AdminBoardSummaryDto> Boards { get; set; } = Array.Empty<AdminBoardSummaryDto>();
    public IReadOnlyList<AdminNotebookSummaryDto> Notebooks { get; set; } = Array.Empty<AdminNotebookSummaryDto>();
    public IReadOnlyList<AuditLogDto> ActivityLog { get; set; } = Array.Empty<AuditLogDto>();
    public IReadOnlyList<AdminFriendDto> Friends { get; set; } = Array.Empty<AdminFriendDto>();
}

public sealed class AdminBoardSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BoardType { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AdminNotebookSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
}
