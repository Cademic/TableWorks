namespace ASideNote.Application.Interfaces;

/// <summary>
/// Broadcasts board-related events to connected SignalR clients for real-time collaboration.
/// </summary>
public interface IBoardHubBroadcaster
{
    Task NotifyNoteAddedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default);
    Task NotifyNoteUpdatedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default);
    Task NotifyNoteUpdatedAsync(Guid boardId, Guid noteId, object? payload, CancellationToken cancellationToken = default);
    Task NotifyNoteDeletedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default);

    Task NotifyIndexCardAddedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default);
    Task NotifyIndexCardUpdatedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default);
    Task NotifyIndexCardUpdatedAsync(Guid boardId, Guid cardId, object? payload, CancellationToken cancellationToken = default);
    Task NotifyIndexCardDeletedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default);

    Task NotifyConnectionAddedAsync(Guid boardId, Guid connectionId, CancellationToken cancellationToken = default);
    Task NotifyConnectionDeletedAsync(Guid boardId, Guid connectionId, CancellationToken cancellationToken = default);

    Task NotifyImageCardAddedAsync(Guid boardId, Guid imageId, CancellationToken cancellationToken = default);
    Task NotifyImageCardAddedAsync(Guid boardId, Guid imageId, object payload, CancellationToken cancellationToken = default);
    Task NotifyImageCardUpdatedAsync(Guid boardId, Guid imageId, CancellationToken cancellationToken = default);
    Task NotifyImageCardUpdatedAsync(Guid boardId, Guid imageId, object payload, CancellationToken cancellationToken = default);
    Task NotifyImageCardDeletedAsync(Guid boardId, Guid imageId, CancellationToken cancellationToken = default);

    Task NotifyDrawingUpdatedAsync(Guid boardId, CancellationToken cancellationToken = default);
}
