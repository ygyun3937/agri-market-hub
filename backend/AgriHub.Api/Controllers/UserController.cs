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

    [HttpGet("watchlist")]
    public async Task<ActionResult<List<WatchItem>>> GetWatchlist()
    {
        var items = await db.WatchItems
            .Where(w => w.UserId == UserId)
            .OrderBy(w => w.Id)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("watchlist")]
    public async Task<IActionResult> AddWatchItem([FromBody] WatchItemRequest req)
    {
        if (await db.WatchItems.AnyAsync(w => w.UserId == UserId && w.ItemCode == req.ItemCode))
            return Conflict("Already in watchlist");
        db.WatchItems.Add(new WatchItem
        {
            UserId = UserId,
            ItemCode = req.ItemCode,
            ItemName = req.ItemName,
            MarketCode = req.MarketCode,
        });
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("watchlist/{itemCode}")]
    public async Task<IActionResult> RemoveWatchItem(string itemCode)
    {
        var item = await db.WatchItems
            .FirstOrDefaultAsync(w => w.UserId == UserId && w.ItemCode == itemCode);
        if (item == null) return NotFound();
        db.WatchItems.Remove(item);
        await db.SaveChangesAsync();
        return Ok();
    }
}
