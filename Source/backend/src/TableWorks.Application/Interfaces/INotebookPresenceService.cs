namespace ASideNote.Application.Interfaces;

/// <summary>
/// In-memory presence for notebook SignalR connections. Tracks which users are viewing which notebooks.
/// </summary>
public interface INotebookPresenceService
{
    void AddPresence(Guid notebookId, string connectionId, Guid userId, string displayName);

    IReadOnlyList<Guid> RemovePresence(string connectionId);

    IReadOnlyList<(Guid UserId, string DisplayName)> GetPresence(Guid notebookId);

    Guid? LeaveNotebook(Guid notebookId, string connectionId);
}
