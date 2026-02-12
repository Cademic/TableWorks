using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.BoardConnections;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/board-connections")]
public sealed class BoardConnectionsController : ControllerBase
{
    private readonly IBoardConnectionService _connectionService;
    private readonly ICurrentUserService _currentUserService;

    public BoardConnectionsController(IBoardConnectionService connectionService, ICurrentUserService currentUserService)
    {
        _connectionService = connectionService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BoardConnectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConnections([FromQuery] Guid? boardId, CancellationToken cancellationToken)
    {
        var result = await _connectionService.GetConnectionsAsync(_currentUserService.UserId, boardId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BoardConnectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateConnection([FromBody] CreateBoardConnectionRequest request, CancellationToken cancellationToken)
    {
        var result = await _connectionService.CreateConnectionAsync(_currentUserService.UserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConnection(Guid id, CancellationToken cancellationToken)
    {
        await _connectionService.DeleteConnectionAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }
}
