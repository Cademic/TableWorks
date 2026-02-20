using Microsoft.EntityFrameworkCore;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class NotebookAccessService : INotebookAccessService
{
    private readonly IRepository<Core.Entities.Notebook> _notebookRepo;
    private readonly IRepository<Core.Entities.Project> _projectRepo;
    private readonly IRepository<Core.Entities.ProjectMember> _memberRepo;

    public NotebookAccessService(
        IRepository<Core.Entities.Notebook> notebookRepo,
        IRepository<Core.Entities.Project> projectRepo,
        IRepository<Core.Entities.ProjectMember> memberRepo)
    {
        _notebookRepo = notebookRepo;
        _projectRepo = projectRepo;
        _memberRepo = memberRepo;
    }

    public async Task<bool> HasReadAccessAsync(Guid userId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .Where(n => n.Id == notebookId)
            .Select(n => new { n.UserId, n.ProjectId })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (notebook is null) return false;
        if (notebook.UserId == userId) return true;
        if (!notebook.ProjectId.HasValue) return false;

        var role = await GetProjectRoleAsync(userId, notebook.ProjectId.Value, cancellationToken);
        return role is not null;
    }

    private async Task<string?> GetProjectRoleAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await _projectRepo.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);

        if (project is null) return null;
        if (project.OwnerId == userId) return "Owner";

        var member = await _memberRepo.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId, cancellationToken);

        return member?.Role;
    }
}
