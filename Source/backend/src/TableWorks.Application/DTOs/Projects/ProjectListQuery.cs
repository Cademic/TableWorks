namespace TableWorks.Application.DTOs.Projects;

public sealed class ProjectListQuery
{
    public string? Status { get; set; }
    public string SortBy { get; set; } = "updatedAt";
    public string SortOrder { get; set; } = "desc";
}
