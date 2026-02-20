namespace ASideNote.Application.Interfaces;

/// <summary>
/// In-memory presence for board SignalR connections. Tracks which users are on which boards
/// for connected-users UI and broadcasts (UserJoined / UserLeft).
/// </summary>
public interface IBoardPresenceService
{
    /// <summary>Add or update presence for a connection on a board. Use displayName (e.g. username) for UI.</summary>
    void AddPresence(Guid boardId, string connectionId, Guid userId, string displayName);

    /// <summary>Remove presence for a connection. Returns the list of board IDs that connection was in.</summary>
    IReadOnlyList<Guid> RemovePresence(string connectionId);

    /// <summary>Get current presence for a board: list of (userId, displayName) excluding duplicates.</summary>
    IReadOnlyList<(Guid UserId, string DisplayName)> GetPresence(Guid boardId);

    /// <summary>Remove this connection from a single board (e.g. on LeaveBoard). Returns the userId that left if connection was present.</summary>
    Guid? LeaveBoard(Guid boardId, string connectionId);
}
