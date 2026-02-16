using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Notebooks;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/notebooks")]
public sealed class NotebooksController : ControllerBase
{
    private readonly INotebookService _notebookService;
    private readonly ICurrentUserService _currentUserService;

    public NotebooksController(INotebookService notebookService, ICurrentUserService currentUserService)
    {
        _notebookService = notebookService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<NotebookSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotebooks([FromQuery] NotebookListQuery query, CancellationToken cancellationToken)
    {
        var result = await _notebookService.GetNotebooksAsync(_currentUserService.UserId, query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(NotebookSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateNotebook([FromBody] CreateNotebookRequest request, CancellationToken cancellationToken)
    {
        var result = await _notebookService.CreateNotebookAsync(_currentUserService.UserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("pinned")]
    [ProducesResponseType(typeof(IReadOnlyList<NotebookSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPinnedNotebooks(CancellationToken cancellationToken)
    {
        var result = await _notebookService.GetPinnedNotebooksAsync(_currentUserService.UserId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NotebookDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetNotebook(Guid id, CancellationToken cancellationToken)
    {
        var result = await _notebookService.GetNotebookByIdAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateNotebook(Guid id, [FromBody] UpdateNotebookRequest request, CancellationToken cancellationToken)
    {
        await _notebookService.UpdateNotebookAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpPut("{id:guid}/pages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateNotebookPages(Guid id, [FromBody] UpdateNotebookPagesRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest();
        await _notebookService.UpdateNotebookPagesAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotebook(Guid id, CancellationToken cancellationToken)
    {
        await _notebookService.DeleteNotebookAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }

    [HttpPut("{id:guid}/pin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TogglePin(Guid id, [FromBody] NotebookTogglePinRequest request, CancellationToken cancellationToken)
    {
        await _notebookService.TogglePinAsync(_currentUserService.UserId, id, request.IsPinned, cancellationToken);
        return Ok();
    }
}

public sealed class NotebookTogglePinRequest
{
    public bool IsPinned { get; set; }
}
