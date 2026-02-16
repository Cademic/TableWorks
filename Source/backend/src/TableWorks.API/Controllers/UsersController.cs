using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Users;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var result = await _userService.GetProfileAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        await _userService.UpdateProfileAsync(_currentUserService.UserId, request, cancellationToken);
        return Ok();
    }

    [HttpGet("me/preferences")]
    [ProducesResponseType(typeof(UserPreferencesDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences(CancellationToken cancellationToken)
    {
        var result = await _userService.GetPreferencesAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("me/preferences")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request, CancellationToken cancellationToken)
    {
        await _userService.UpdatePreferencesAsync(_currentUserService.UserId, request, cancellationToken);
        return Ok();
    }

    [HttpPut("me/password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await _userService.ChangePasswordAsync(_currentUserService.UserId, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest? request, CancellationToken cancellationToken)
    {
        await _userService.DeleteAccountAsync(_currentUserService.UserId, request?.Password, cancellationToken);
        return NoContent();
    }

    [HttpGet("me/friends")]
    [ProducesResponseType(typeof(IReadOnlyList<FriendDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFriends(CancellationToken cancellationToken)
    {
        var result = await _userService.GetFriendsAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/friend-requests")]
    [ProducesResponseType(typeof(IReadOnlyList<FriendRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingFriendRequests(CancellationToken cancellationToken)
    {
        var result = await _userService.GetPendingReceivedRequestsAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/friend-requests/status")]
    [ProducesResponseType(typeof(FriendStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFriendStatus([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _userService.GetFriendStatusAsync(_currentUserService.UserId, userId, cancellationToken);
        return Ok(result!);
    }

    [HttpPost("me/friend-requests")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestRequest request, CancellationToken cancellationToken)
    {
        await _userService.SendFriendRequestAsync(_currentUserService.UserId, request.ReceiverId, cancellationToken);
        return NoContent();
    }

    [HttpPost("me/friend-requests/{id:guid}/accept")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptFriendRequest([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _userService.AcceptFriendRequestAsync(_currentUserService.UserId, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("me/friend-requests/{id:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectFriendRequest([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _userService.RejectFriendRequestAsync(_currentUserService.UserId, id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("me/friends/{friendId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFriend([FromRoute] Guid friendId, CancellationToken cancellationToken)
    {
        await _userService.RemoveFriendAsync(_currentUserService.UserId, friendId, cancellationToken);
        return NoContent();
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(IReadOnlyList<UserPublicDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsers([FromQuery] string q, [FromQuery] int limit = 20, CancellationToken cancellationToken = default)
    {
        var result = await _userService.SearchUsersAsync(_currentUserService.UserId, q ?? string.Empty, Math.Clamp(limit, 1, 50), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserPublicDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicProfile([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _userService.GetPublicProfileAsync(id, _currentUserService.UserId, cancellationToken);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
