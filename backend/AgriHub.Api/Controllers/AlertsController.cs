using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/alerts")]
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

        if (alerts.Count > 0)
            return Ok(alerts);

        // Fallback: map recent pest-tagged news to PestAlert shape
        var news = await db.NewsArticles
            .Where(n => n.Tag == "pest")
            .OrderByDescending(n => n.PublishedAt)
            .Take(10)
            .ToListAsync();

        var fallback = news.Select(n => new PestAlert
        {
            Id = n.Id,
            Region = n.Source ?? "",
            ItemName = n.Title,
            Severity = "",
            Description = n.Summary ?? "",
            ReportedAt = n.PublishedAt ?? DateTime.UtcNow,
        }).ToList();

        return Ok(fallback);
    }
}
