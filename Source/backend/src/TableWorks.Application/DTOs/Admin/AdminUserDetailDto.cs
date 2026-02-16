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
    public IReadOnlyList<AuditLogDto> ActivityLog { get; set; } = Array.Empty<AuditLogDto>();
    public IReadOnlyList<AdminFriendDto> Friends { get; set; } = Array.Empty<AdminFriendDto>();
}
