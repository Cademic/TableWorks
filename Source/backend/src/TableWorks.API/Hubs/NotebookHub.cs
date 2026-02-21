using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;
using System.Security.Claims;

namespace ASideNote.API.Hubs;

[Authorize]
public sealed class NotebookHub : Hub
{
    public const string GroupPrefix = "notebook:";
    private readonly INotebookAccessService _notebookAccess;
    private readonly INotebookPresenceService _presence;
    private readonly IRepository<User> _userRepo;
    private readonly ILogger<NotebookHub> _logger;

    public NotebookHub(
        INotebookAccessService notebookAccess,
        INotebookPresenceService presence,
        IRepository<User> userRepo,
        ILogger<NotebookHub> logger)
    {
        _notebookAccess = notebookAccess;
        _presence = presence;
        _userRepo = userRepo;
        _logger = logger;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var notebookIds = _presence.RemovePresence(Context.ConnectionId!);
        var userId = GetUserId();
        foreach (var notebookId in notebookIds)
        {
            if (userId.HasValue)
                await Clients.Group(GroupPrefix + notebookId.ToString()).SendAsync("UserLeft", userId.Value);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinNotebook(Guid notebookId)
    {
        var cancellationToken = Context.ConnectionAborted;
        var userId = GetUserId();
        if (userId is null)
        {
            _logger.LogWarning("JoinNotebook: User not authenticated.");
            throw new HubException("Unauthorized");
        }

        var hasAccess = await _notebookAccess.HasReadAccessAsync(userId.Value, notebookId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning("JoinNotebook: User {UserId} has no read access to notebook {NotebookId}", userId, notebookId);
            throw new HubException("Access denied to this notebook.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupPrefix + notebookId.ToString(), cancellationToken);

        var displayName = await _userRepo.Query()
            .Where(u => u.Id == userId.Value)
            .Select(u => u.Username)
            .FirstOrDefaultAsync(cancellationToken) ?? userId.Value.ToString();

        _presence.AddPresence(notebookId, Context.ConnectionId!, userId.Value, displayName);

        var presenceList = _presence.GetPresence(notebookId)
            .Select(p => new { userId = p.UserId, displayName = p.DisplayName })
            .ToList();
        await Clients.Caller.SendAsync("PresenceList", presenceList, cancellationToken);
        await Clients.OthersInGroup(GroupPrefix + notebookId.ToString()).SendAsync("UserJoined", userId.Value, displayName, cancellationToken);

        _logger.LogDebug("JoinNotebook: User {UserId} joined notebook {NotebookId}", userId, notebookId);
    }

    public async Task LeaveNotebook(Guid notebookId)
    {
        var cancellationToken = Context.ConnectionAborted;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupPrefix + notebookId.ToString(), cancellationToken);
        var leftUserId = _presence.LeaveNotebook(notebookId, Context.ConnectionId!);
        if (leftUserId.HasValue)
            await Clients.OthersInGroup(GroupPrefix + notebookId.ToString()).SendAsync("UserLeft", leftUserId.Value, cancellationToken);
    }

    /// <summary>Broadcast text cursor position within the notebook editor for collaborative editing.</summary>
    public async Task TextCursorPosition(Guid notebookId, int position)
    {
        var userId = GetUserId();
        if (userId is null) return;
        var groupName = GroupPrefix + notebookId.ToString();
        await Clients.OthersInGroup(groupName).SendAsync("TextCursorPosition", userId.Value, position);
    }

    private Guid? GetUserId()
    {
        var sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
