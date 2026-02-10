using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TableWorks.Application.DTOs.Folders;
using TableWorks.Application.Interfaces;

namespace TableWorks.API.Controllers;

[Authorize]
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/folders")]
public sealed class FoldersController : ControllerBase
{
    private readonly IFolderService _folderService;
    private readonly ICurrentUserService _currentUserService;

    public FoldersController(IFolderService folderService, ICurrentUserService currentUserService)
    {
        _folderService = folderService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<FolderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFolders([FromQuery] Guid? parentId, CancellationToken cancellationToken)
    {
        var result = await _folderService.GetFoldersAsync(_currentUserService.UserId, parentId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(FolderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request, CancellationToken cancellationToken)
    {
        var result = await _folderService.CreateFolderAsync(_currentUserService.UserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderRequest request, CancellationToken cancellationToken)
    {
        await _folderService.UpdateFolderAsync(_currentUserService.UserId, id, request, cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFolder(Guid id, CancellationToken cancellationToken)
    {
        await _folderService.DeleteFolderAsync(_currentUserService.UserId, id, cancellationToken);
        return Ok();
    }
}
