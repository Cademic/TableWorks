using Microsoft.AspNetCore.SignalR;
using ASideNote.Application.Interfaces;
using ASideNote.API.Hubs;

namespace ASideNote.API.Services;

public sealed class NotebookHubBroadcaster : INotebookHubBroadcaster
{
    private readonly IHubContext<NotebookHub> _hubContext;

    public NotebookHubBroadcaster(IHubContext<NotebookHub> hubContext)
    {
        _hubContext = hubContext;
    }

    private static string GroupName(Guid notebookId) => NotebookHub.GroupPrefix + notebookId.ToString();

    public Task NotifyNotebookUpdatedAsync(Guid notebookId, object payload, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.Group(GroupName(notebookId)).SendAsync("NotebookUpdated", new { notebookId, payload }, cancellationToken);
}
