using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private int UserId => (int)HttpContext.Items["UserId"]!;

    [HttpGet("vapid-public-key")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult GetVapidPublicKey()
    {
        return Ok(new { publicKey = config["VapidPublicKey"] ?? "" });
    }

    [HttpGet("settings")]
    public async Task<ActionResult<UserSetting>> GetSettings()
    {
        var settings = await db.UserSettings.FindAsync(UserId);
        if (settings == null) return NotFound();
        return Ok(settings);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(UserSettingsRequest req)
    {
        var settings = await db.UserSettings.FindAsync(UserId);
        if (settings == null)
        {
            db.UserSettings.Add(new UserSetting
            {
                UserId = UserId,
                WatchRegions = req.WatchRegions,
                AlertThresholds = req.AlertThresholds,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            settings.WatchRegions = req.WatchRegions;
            settings.AlertThresholds = req.AlertThresholds;
            settings.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return Ok();
    }
}
