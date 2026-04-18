using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController(AppDbContext db) : ControllerBase
{
    [HttpGet("disaster")]
    public async Task<ActionResult<List<DisasterAlert>>> GetDisaster()
    {
        var now = DateTime.UtcNow;
        var alerts = await db.DisasterAlerts
            .Where(a => a.ExpiresAt == null || a.ExpiresAt > now)
            .OrderByDescending(a => a.IssuedAt)
            .Take(10)
            .ToListAsync();
        return Ok(alerts);
    }

    [HttpGet("pest")]
    public async Task<ActionResult<List<PestAlert>>> GetPest()
    {
        var alerts = await db.PestAlerts
            .OrderByDescending(a => a.ReportedAt)
            .Take(10)
            .ToListAsync();
        return Ok(alerts);
    }
}
