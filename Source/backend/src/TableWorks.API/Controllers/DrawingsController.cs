using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Drawings;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/boards/{boardId:guid}/drawing")]
public sealed class DrawingsController : ControllerBase
{
    private readonly IDrawingService _drawingService;
    private readonly ICurrentUserService _currentUserService;

    public DrawingsController(IDrawingService drawingService, ICurrentUserService currentUserService)
    {
        _drawingService = drawingService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(DrawingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDrawing(Guid boardId, CancellationToken cancellationToken)
    {
        var result = await _drawingService.GetByBoardIdAsync(_currentUserService.UserId, boardId, cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    [ProducesResponseType(typeof(DrawingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveDrawing(Guid boardId, [FromBody] SaveDrawingRequest request, CancellationToken cancellationToken)
    {
        var result = await _drawingService.SaveAsync(_currentUserService.UserId, boardId, request, cancellationToken);
        return Ok(result);
    }
}
