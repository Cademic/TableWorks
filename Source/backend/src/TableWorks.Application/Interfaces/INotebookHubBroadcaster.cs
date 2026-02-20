namespace ASideNote.Application.Interfaces;

/// <summary>
/// Broadcasts notebook-related events to connected SignalR clients for real-time collaboration.
/// </summary>
public interface INotebookHubBroadcaster
{
    Task NotifyNotebookUpdatedAsync(Guid notebookId, object payload, CancellationToken cancellationToken = default);
}
