using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.BoardImages;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/boards/{boardId:guid}/image-cards")]
public sealed class BoardImagesController : ControllerBase
{
    private readonly IBoardImageService _boardImageService;
    private readonly ICurrentUserService _currentUserService;

    public BoardImagesController(
        IBoardImageService boardImageService,
        ICurrentUserService currentUserService)
    {
        _boardImageService = boardImageService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BoardImageSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImages(Guid boardId, CancellationToken cancellationToken)
    {
        var result = await _boardImageService.GetByBoardIdAsync(_currentUserService.UserId, boardId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BoardImageSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateImage(Guid boardId, [FromBody] CreateBoardImageRequest request, CancellationToken cancellationToken)
    {
        var result = await _boardImageService.CreateAsync(_currentUserService.UserId, boardId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchImage(Guid boardId, Guid id, [FromBody] PatchBoardImageRequest request, CancellationToken cancellationToken)
    {
        await _boardImageService.PatchAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(Guid boardId, Guid id, CancellationToken cancellationToken)
    {
        await _boardImageService.DeleteAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }
}
