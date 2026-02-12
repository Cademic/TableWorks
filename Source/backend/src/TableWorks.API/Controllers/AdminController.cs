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

    [HttpDelete("users/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserAsync(id, cancellationToken);
        return Ok();
    }

    [HttpGet("notes")]
    [ProducesResponseType(typeof(PaginatedResponse<AdminNoteDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotes([FromQuery] AdminNoteListQuery query, CancellationToken cancellationToken)
    {
        var result = await _adminService.GetNotesAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("notes/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNote(Guid id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteNoteAsync(id, cancellationToken);
        return Ok();
    }

    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(PaginatedResponse<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogListQuery query, CancellationToken cancellationToken)
    {
        var result = await _adminService.GetAuditLogsAsync(query, cancellationToken);
        return Ok(result);
    }
}
