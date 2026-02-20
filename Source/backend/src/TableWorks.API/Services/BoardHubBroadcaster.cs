using Microsoft.AspNetCore.SignalR;
using ASideNote.Application.Interfaces;
using ASideNote.API.Hubs;

namespace ASideNote.API.Services;

public sealed class BoardHubBroadcaster : IBoardHubBroadcaster
{
    private readonly IHubContext<BoardHub> _hubContext;

    public BoardHubBroadcaster(IHubContext<BoardHub> hubContext)
    {
        _hubContext = hubContext;
    }

    private string GroupName(Guid boardId) => BoardHub.GroupPrefix + boardId.ToString();

    public Task NotifyNoteAddedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("NoteAdded", new { boardId, noteId }, cancellationToken);

    public Task NotifyNoteUpdatedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("NoteUpdated", new { boardId, noteId }, cancellationToken);

    public Task NotifyNoteUpdatedAsync(Guid boardId, Guid noteId, object? payload, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("NoteUpdated", payload is null ? new { boardId, noteId } : new { boardId, noteId, payload }, cancellationToken);

    public Task NotifyNoteDeletedAsync(Guid boardId, Guid noteId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("NoteDeleted", new { boardId, noteId }, cancellationToken);

    public Task NotifyIndexCardAddedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("IndexCardAdded", new { boardId, cardId }, cancellationToken);

    public Task NotifyIndexCardUpdatedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("IndexCardUpdated", new { boardId, cardId }, cancellationToken);

    public Task NotifyIndexCardUpdatedAsync(Guid boardId, Guid cardId, object? payload, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("IndexCardUpdated", payload is null ? new { boardId, cardId } : new { boardId, cardId, payload }, cancellationToken);

    public Task NotifyIndexCardDeletedAsync(Guid boardId, Guid cardId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("IndexCardDeleted", new { boardId, cardId }, cancellationToken);

    public Task NotifyConnectionAddedAsync(Guid boardId, Guid connectionId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("ConnectionAdded", new { boardId, connectionId }, cancellationToken);

    public Task NotifyConnectionDeletedAsync(Guid boardId, Guid connectionId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("ConnectionDeleted", new { boardId, connectionId }, cancellationToken);

    public Task NotifyDrawingUpdatedAsync(Guid boardId, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(boardId)).SendAsync("DrawingUpdated", new { boardId }, cancellationToken);
}
