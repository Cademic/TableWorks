using ASideNote.Application.Interfaces;

namespace ASideNote.API.Services;

public sealed class BoardPresenceService : IBoardPresenceService
{
    private readonly object _lock = new();
    private readonly Dictionary<string, (Guid UserId, string DisplayName, HashSet<Guid> BoardIds)> _byConnection = new();

    public void AddPresence(Guid boardId, string connectionId, Guid userId, string displayName)
    {
        lock (_lock)
        {
            if (!_byConnection.TryGetValue(connectionId, out var entry))
            {
                entry = (userId, displayName, new HashSet<Guid>());
                _byConnection[connectionId] = entry;
            }
            entry.BoardIds.Add(boardId);
            _byConnection[connectionId] = (entry.UserId, entry.DisplayName, entry.BoardIds);
        }
    }

    public IReadOnlyList<Guid> RemovePresence(string connectionId)
    {
        lock (_lock)
        {
            if (!_byConnection.Remove(connectionId, out var entry))
                return Array.Empty<Guid>();
            return entry.BoardIds.ToList();
        }
    }

    public IReadOnlyList<(Guid UserId, string DisplayName)> GetPresence(Guid boardId)
    {
        lock (_lock)
        {
            var seen = new HashSet<Guid>();
            var list = new List<(Guid, string)>();
            foreach (var (userId, displayName, boardIds) in _byConnection.Values)
            {
                if (boardIds.Contains(boardId) && seen.Add(userId))
                    list.Add((userId, displayName));
            }
            return list;
        }
    }

    public Guid? LeaveBoard(Guid boardId, string connectionId)
    {
        lock (_lock)
        {
            if (!_byConnection.TryGetValue(connectionId, out var entry))
                return null;
            var removed = entry.BoardIds.Remove(boardId);
            if (entry.BoardIds.Count == 0)
                _byConnection.Remove(connectionId);
            return removed ? entry.UserId : null;
        }
    }
}
