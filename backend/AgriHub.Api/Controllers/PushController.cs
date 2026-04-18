using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/push")]
[Authorize]
public class PushController(AppDbContext db) : ControllerBase
{
    private int UserId => (int)HttpContext.Items["UserId"]!;

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(PushSubscriptionRequest req)
    {
        var existing = await db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == UserId && s.Endpoint == req.Endpoint);
        if (existing != null) return Ok();

        db.PushSubscriptions.Add(new PushSubscription
        {
            UserId = UserId,
            Endpoint = req.Endpoint,
            P256Dh = req.P256Dh,
            Auth = req.Auth,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return Ok();
    }
}
