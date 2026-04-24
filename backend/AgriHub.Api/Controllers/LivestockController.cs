using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;

namespace AgriHub.Api.Controllers;

public record LivestockDailyDto(
    string ItemCode,
    string ItemName,
    string Category,
    string Origin,
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

public record LivestockOriginDto(
    string Origin,
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
                       t.origin     AS "Origin",
                       t.date       AS "Date",
                       t.price      AS "Price",
                       t.unit       AS "Unit",
                       CASE WHEN w.price > 0
                            THEN ROUND(((t.price - w.price) / w.price * 100)::numeric, 1)
                            ELSE NULL END AS "Change7d"
                FROM   livestock_prices t
                LEFT JOIN livestock_prices w
                       ON w.item_code = t.item_code AND w.origin = t.origin AND w.date = {1}
                WHERE  t.date = {0}
                ORDER  BY t.category, t.item_name, t.origin DESC
                """,
                targetDate, week)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/livestock/trend?itemCode=XXX&days=30&origin=국내산
    [HttpGet("trend")]
    public async Task<ActionResult<List<LivestockTrendDto>>> GetTrend(
        [FromQuery] string itemCode,
        [FromQuery] int days = 30,
        [FromQuery] string origin = "국내산")
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
                  AND  origin = {2}
                  AND  date >= {1}
                ORDER  BY date ASC
                """,
                itemCode, from, origin)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/livestock/origin?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("origin")]
    public async Task<ActionResult<List<LivestockOriginDto>>> GetOrigin(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(9).AddDays(-1));

        var rows = await db.Database
            .SqlQueryRaw<LivestockOriginDto>(
                """
                SELECT origin AS "Origin",
                       price  AS "Price",
                       unit   AS "Unit"
                FROM   livestock_prices
                WHERE  item_code = {0}
                  AND  date = {1}
                ORDER  BY origin DESC
                """,
                itemCode, targetDate)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/livestock/market-prices?itemCode=XXX&date=YYYY-MM-DD&origin=국내산
    [HttpGet("market-prices")]
    public async Task<ActionResult<List<MarketPriceDto>>> GetMarketPrices(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date,
        [FromQuery] string origin = "국내산")
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(9).AddDays(-1));
        var from = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<LivestockMarketRow>(
                """
                SELECT DISTINCT ON (market_code)
                       market_code AS "MarketCode",
                       price       AS "Price",
                       unit        AS "Unit"
                FROM   livestock_prices
                WHERE  item_code = {0}
                  AND  origin    = {3}
                  AND  date BETWEEN {1} AND {2}
                  AND  price > 0
                ORDER  BY market_code, date DESC
                """,
                itemCode, from, targetDate, origin)
            .ToListAsync();

        var result = rows
            .Select(r => new MarketPriceDto(
                r.MarketCode,
                KamisMarkets.Names.GetValueOrDefault(r.MarketCode, r.MarketCode),
                r.Price,
                r.Unit))
            .OrderByDescending(r => r.Price)
            .ToList();

        return Ok(result);
    }

    private record LivestockMarketRow(string MarketCode, decimal Price, string? Unit);
}
