namespace ASideNote.Application.Interfaces;

public interface INotebookAccessService
{
    Task<bool> HasReadAccessAsync(Guid userId, Guid notebookId, CancellationToken cancellationToken = default);
}
