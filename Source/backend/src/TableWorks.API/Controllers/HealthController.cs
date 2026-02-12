using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace ASideNote.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            service = "ASideNote.API",
            utcTimestamp = DateTime.UtcNow
        });
    }
}
