using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Boards;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/boards")]
public sealed class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;
    private readonly ICurrentUserService _currentUserService;

    public BoardsController(IBoardService boardService, ICurrentUserService currentUserService)
    {
        _boardService = boardService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<BoardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBoards([FromQuery] BoardListQuery query, CancellationToken cancellationToken)
    {
        var result = await _boardService.GetBoardsAsync(_currentUserService.UserId, query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BoardSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBoard([FromBody] CreateBoardRequest request, CancellationToken cancellationToken)
    {
        var result = await _boardService.CreateBoardAsync(_currentUserService.UserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BoardSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBoard(Guid id, CancellationToken cancellationToken)
    {
        var result = await _boardService.GetBoardByIdAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBoard(Guid id, [FromBody] UpdateBoardRequest request, CancellationToken cancellationToken)
    {
        await _boardService.UpdateBoardAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBoard(Guid id, CancellationToken cancellationToken)
    {
        await _boardService.DeleteBoardAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }

    [HttpPut("{id:guid}/pin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TogglePin(Guid id, [FromBody] TogglePinRequest request, CancellationToken cancellationToken)
    {
        await _boardService.TogglePinAsync(_currentUserService.UserId, id, request.IsPinned, cancellationToken);
        return Ok();
    }

    [HttpGet("pinned")]
    [ProducesResponseType(typeof(IReadOnlyList<BoardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPinnedBoards(CancellationToken cancellationToken)
    {
        var result = await _boardService.GetPinnedBoardsAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }
}

public sealed class TogglePinRequest
{
    public bool IsPinned { get; set; }
}
