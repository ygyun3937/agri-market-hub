using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/fuel")]
public class FuelController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<FuelPrice>>> GetFuel()
    {
        var gasoline = await db.FuelPrices
            .Where(f => f.Type == "gasoline")
            .OrderByDescending(f => f.CollectedAt)
            .FirstOrDefaultAsync();
        var diesel = await db.FuelPrices
            .Where(f => f.Type == "diesel")
            .OrderByDescending(f => f.CollectedAt)
            .FirstOrDefaultAsync();

        var result = new List<FuelPrice>();
        if (gasoline != null) result.Add(gasoline);
        if (diesel != null) result.Add(diesel);
        return Ok(result);
    }
}
