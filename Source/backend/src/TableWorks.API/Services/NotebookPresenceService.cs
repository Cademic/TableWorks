using ASideNote.Application.Interfaces;

namespace ASideNote.API.Services;

public sealed class NotebookPresenceService : INotebookPresenceService
{
    private readonly object _lock = new();
    private readonly Dictionary<string, (Guid UserId, string DisplayName, HashSet<Guid> NotebookIds)> _byConnection = new();

    public void AddPresence(Guid notebookId, string connectionId, Guid userId, string displayName)
    {
        lock (_lock)
        {
            if (!_byConnection.TryGetValue(connectionId, out var entry))
            {
                entry = (userId, displayName, new HashSet<Guid>());
                _byConnection[connectionId] = entry;
            }
            entry.NotebookIds.Add(notebookId);
            _byConnection[connectionId] = (entry.UserId, entry.DisplayName, entry.NotebookIds);
        }
    }

    public IReadOnlyList<Guid> RemovePresence(string connectionId)
    {
        lock (_lock)
        {
            if (!_byConnection.Remove(connectionId, out var entry))
                return Array.Empty<Guid>();
            return entry.NotebookIds.ToList();
        }
    }

    public IReadOnlyList<(Guid UserId, string DisplayName)> GetPresence(Guid notebookId)
    {
        lock (_lock)
        {
            var seen = new HashSet<Guid>();
            var list = new List<(Guid, string)>();
            foreach (var (userId, displayName, notebookIds) in _byConnection.Values)
            {
                if (notebookIds.Contains(notebookId) && seen.Add(userId))
                    list.Add((userId, displayName));
            }
            return list;
        }
    }

    public Guid? LeaveNotebook(Guid notebookId, string connectionId)
    {
        lock (_lock)
        {
            if (!_byConnection.TryGetValue(connectionId, out var entry))
                return null;
            var removed = entry.NotebookIds.Remove(notebookId);
            if (entry.NotebookIds.Count == 0)
                _byConnection.Remove(connectionId);
            return removed ? entry.UserId : null;
        }
    }
}
