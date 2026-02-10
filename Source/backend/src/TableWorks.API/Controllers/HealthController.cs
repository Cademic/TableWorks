using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace TableWorks.API.Controllers;

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
            service = "TableWorks.API",
            utcTimestamp = DateTime.UtcNow
        });
    }
}
