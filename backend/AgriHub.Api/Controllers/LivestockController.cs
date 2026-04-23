using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;

namespace AgriHub.Api.Controllers;

public record LivestockDailyDto(
    string ItemCode,
    string ItemName,
    string Category,
    DateOnly Date,
    decimal Price,
    string? Unit,
    decimal? Change7d);

public record LivestockTrendDto(
    string ItemCode,
    string ItemName,
    string Category,
    DateOnly Date,
    decimal Price,
    string? Unit);

[ApiController]
[Route("api/livestock")]
public class LivestockController(AppDbContext db) : ControllerBase
{
    // GET /api/livestock/daily?date=YYYY-MM-DD
    [HttpGet("daily")]
    public async Task<ActionResult<List<LivestockDailyDto>>> GetDaily([FromQuery] DateOnly? date)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(9).AddDays(-1));
        var week = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<LivestockDailyDto>(
                """
                SELECT t.item_code  AS "ItemCode",
                       t.item_name  AS "ItemName",
                       t.category   AS "Category",
                       t.date       AS "Date",
                       t.price      AS "Price",
                       t.unit       AS "Unit",
                       CASE WHEN w.price > 0
                            THEN ROUND(((t.price - w.price) / w.price * 100)::numeric, 1)
                            ELSE NULL END AS "Change7d"
                FROM   livestock_prices t
                LEFT JOIN livestock_prices w
                       ON w.item_code = t.item_code AND w.date = {1}
                WHERE  t.date = {0}
                ORDER  BY t.category, t.item_name
                """,
                targetDate, week)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/livestock/trend?itemCode=XXX&days=30
    [HttpGet("trend")]
    public async Task<ActionResult<List<LivestockTrendDto>>> GetTrend(
        [FromQuery] string itemCode,
        [FromQuery] int days = 30)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        days = Math.Clamp(days, 1, 90);
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(9).AddDays(-days));

        var rows = await db.Database
            .SqlQueryRaw<LivestockTrendDto>(
                """
                SELECT item_code  AS "ItemCode",
                       item_name  AS "ItemName",
                       category   AS "Category",
                       date       AS "Date",
                       price      AS "Price",
                       unit       AS "Unit"
                FROM   livestock_prices
                WHERE  item_code = {0}
                  AND  date >= {1}
                ORDER  BY date ASC
                """,
                itemCode, from)
            .ToListAsync();

        return Ok(rows);
    }
}
