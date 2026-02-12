using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.DTOs.IndexCards;
using ASideNote.Application.Interfaces;

namespace ASideNote.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/index-cards")]
public sealed class IndexCardsController : ControllerBase
{
    private readonly IIndexCardService _indexCardService;
    private readonly ICurrentUserService _currentUserService;

    public IndexCardsController(IIndexCardService indexCardService, ICurrentUserService currentUserService)
    {
        _indexCardService = indexCardService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<IndexCardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIndexCards([FromQuery] IndexCardListQuery query, CancellationToken cancellationToken)
    {
        var result = await _indexCardService.GetIndexCardsAsync(_currentUserService.UserId, query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(IndexCardDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateIndexCard([FromBody] CreateIndexCardRequest request, CancellationToken cancellationToken)
    {
        var result = await _indexCardService.CreateIndexCardAsync(_currentUserService.UserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(IndexCardDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIndexCard(Guid id, CancellationToken cancellationToken)
    {
        var result = await _indexCardService.GetIndexCardByIdAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchIndexCard(Guid id, [FromBody] PatchIndexCardRequest request, CancellationToken cancellationToken)
    {
        await _indexCardService.PatchIndexCardAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteIndexCard(Guid id, CancellationToken cancellationToken)
    {
        await _indexCardService.DeleteIndexCardAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }
}
