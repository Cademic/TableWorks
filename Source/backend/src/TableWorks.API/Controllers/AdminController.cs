using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Admin;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/admin")]
public sealed class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var result = await _adminService.GetAdminStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("analytics")]
    [ProducesResponseType(typeof(AdminAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken)
    {
        var result = await _adminService.GetAdminAnalyticsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(PaginatedResponse<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserListQuery query, CancellationToken cancellationToken)
    {
        var result = await _adminService.GetUsersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("users/{id:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDetail(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminService.GetUserDetailAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPut("users/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        await _adminService.UpdateUserStatusAsync(id, request, cancellationToken);
        return Ok();
    }

    [HttpPut("users/{id:guid}/role")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        await _adminService.UpdateUserRoleAsync(id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("users/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserAsync(id, cancellationToken);
        return Ok();
    }

    [HttpDelete("users/{id:guid}/friends/{friendId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveUserFriend(Guid id, Guid friendId, CancellationToken cancellationToken)
    {
        await _adminService.RemoveUserFriendAsync(id, friendId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("projects/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserProjectAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("boards/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBoard(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserBoardAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("notebooks/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotebook(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserNotebookAsync(id, cancellationToken);
        return NoContent();
    }
}
