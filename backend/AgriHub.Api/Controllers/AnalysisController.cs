using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;

namespace AgriHub.Api.Controllers;

public record DailyAuctionDto(
    string ItemCode,
    string ItemName,
    string Category,
    DateOnly Date,
    decimal AvgPrice,
    decimal MinPrice,
    decimal MaxPrice,
    decimal Volume,
    decimal? Change7d,
    string? Unit);

public record TrendDto(
    string ItemCode,
    string ItemName,
    string Category,
    DateOnly Date,
    decimal AvgPrice,
    decimal MinPrice,
    decimal MaxPrice,
    decimal Volume,
    string? Unit);

public record MarketSummaryDto(
    string MarketCode,
    string MarketName,
    decimal AvgPrice,
    decimal Volume,
    string? Unit);

public record BreakdownDto(string Label, decimal AvgPrice, decimal Volume);

public record MarketDto(string Code, string Name);
public record MarketProductDto(string ItemCode, string ItemName, string Category, decimal AvgPrice, decimal MinPrice, decimal MaxPrice, decimal Volume);

[ApiController]
[Route("api/[controller]")]
public class AnalysisController(AppDbContext db) : ControllerBase
{
    // GET /api/analysis/daily?date=YYYY-MM-DD
    [HttpGet("daily")]
    public async Task<ActionResult<List<DailyAuctionDto>>> GetDaily([FromQuery] DateOnly? date)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var week = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<DailyAuctionDto>(
                """
                SELECT t.item_code   AS "ItemCode",
                       t.item_name   AS "ItemName",
                       t.category    AS "Category",
                       t.date        AS "Date",
                       t.avg_price   AS "AvgPrice",
                       t.min_price   AS "MinPrice",
                       t.max_price   AS "MaxPrice",
                       t.volume      AS "Volume",
                       CASE WHEN w.avg_price > 0
                            THEN ROUND(((t.avg_price - w.avg_price) / w.avg_price * 100)::numeric, 1)
                            ELSE NULL END AS "Change7d",
                       (SELECT MODE() WITHIN GROUP (ORDER BY ar.unit)
                        FROM auction_raw ar
                        WHERE ar.item_code = t.item_code AND ar.date = {0}) AS "Unit"
                FROM   daily_auction t
                LEFT JOIN daily_auction w
                       ON w.item_code = t.item_code AND w.date = {1}
                WHERE  t.date = {0}
                ORDER  BY t.volume DESC
                LIMIT  100
                """,
                targetDate, week)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/analysis/trend?itemCode=XXX&days=30
    [HttpGet("trend")]
    public async Task<ActionResult<List<TrendDto>>> GetTrend(
        [FromQuery] string itemCode,
        [FromQuery] int days = 30)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        days = Math.Clamp(days, 1, 90);
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var rows = await db.Database
            .SqlQueryRaw<TrendDto>(
                """
                SELECT item_code   AS "ItemCode",
                       item_name   AS "ItemName",
                       category    AS "Category",
                       date        AS "Date",
                       avg_price   AS "AvgPrice",
                       min_price   AS "MinPrice",
                       max_price   AS "MaxPrice",
                       volume      AS "Volume",
                       (SELECT MODE() WITHIN GROUP (ORDER BY ar.unit)
                        FROM auction_raw ar
                        WHERE ar.item_code = daily_auction.item_code
                          AND ar.date = daily_auction.date) AS "Unit"
                FROM   daily_auction
                WHERE  item_code = {0}
                  AND  date >= {1}
                ORDER  BY date ASC
                """,
                itemCode, from)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/analysis/markets?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("markets")]
    public async Task<ActionResult<List<MarketSummaryDto>>> GetMarkets(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));

        var rows = await db.Database
            .SqlQueryRaw<MarketSummaryDto>(
                """
                SELECT market_code  AS "MarketCode",
                       market_name  AS "MarketName",
                       AVG(price)   AS "AvgPrice",
                       SUM(volume)  AS "Volume",
                       MODE() WITHIN GROUP (ORDER BY unit) AS "Unit"
                FROM   auction_raw
                WHERE  item_code = {0}
                  AND  date      = {1}
                GROUP  BY market_code, market_name
                ORDER  BY "Volume" DESC
                """,
                itemCode, targetDate)
            .ToListAsync();

        return Ok(rows);
    }

    // GET /api/analysis/variety?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("variety")]
    public async Task<ActionResult<List<BreakdownDto>>> GetVariety(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var from = targetDate.AddDays(-30);
        var rows = await db.Database
            .SqlQueryRaw<BreakdownDto>(
                """
                SELECT COALESCE(NULLIF(TRIM(variety),''), '기타') AS "Label",
                       ROUND(AVG(price))  AS "AvgPrice",
                       SUM(volume)        AS "Volume"
                FROM   auction_raw
                WHERE  item_code = {0} AND date BETWEEN {1} AND {2} AND price > 0
                GROUP  BY COALESCE(NULLIF(TRIM(variety),''), '기타')
                ORDER  BY "Volume" DESC
                LIMIT  10
                """,
                itemCode, from, targetDate)
            .ToListAsync();
        return Ok(rows);
    }

    // GET /api/analysis/origin?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("origin")]
    public async Task<ActionResult<List<BreakdownDto>>> GetOrigin(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var from = targetDate.AddDays(-30);
        var rows = await db.Database
            .SqlQueryRaw<BreakdownDto>(
                """
                SELECT COALESCE(NULLIF(TRIM(origin),''), '기타') AS "Label",
                       ROUND(AVG(price))  AS "AvgPrice",
                       SUM(volume)        AS "Volume"
                FROM   auction_raw
                WHERE  item_code = {0} AND date BETWEEN {1} AND {2} AND price > 0
                GROUP  BY COALESCE(NULLIF(TRIM(origin),''), '기타')
                ORDER  BY "Volume" DESC
                LIMIT  10
                """,
                itemCode, from, targetDate)
            .ToListAsync();
        return Ok(rows);
    }

    // GET /api/analysis/market-list
    [HttpGet("market-list")]
    public async Task<ActionResult<List<MarketDto>>> GetMarketList()
    {
        var rows = await db.Database
            .SqlQueryRaw<MarketDto>(
                """
                SELECT code AS "Code", name AS "Name"
                FROM   markets
                ORDER  BY name
                """)
            .ToListAsync();
        return Ok(rows);
    }

    // GET /api/analysis/market-products?marketCode=XXX&date=YYYY-MM-DD
    [HttpGet("market-products")]
    public async Task<ActionResult<List<MarketProductDto>>> GetMarketProducts(
        [FromQuery] string marketCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(marketCode))
            return BadRequest("marketCode is required.");
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var rows = await db.Database
            .SqlQueryRaw<MarketProductDto>(
                """
                SELECT item_code          AS "ItemCode",
                       MAX(item_name)     AS "ItemName",
                       MAX(category)      AS "Category",
                       ROUND(AVG(price))  AS "AvgPrice",
                       MIN(price)         AS "MinPrice",
                       MAX(price)         AS "MaxPrice",
                       SUM(volume)        AS "Volume"
                FROM   auction_raw
                WHERE  market_code = {0} AND date = {1} AND price > 0
                GROUP  BY item_code
                ORDER  BY "Volume" DESC
                """,
                marketCode, targetDate)
            .ToListAsync();
        return Ok(rows);
    }

    // GET /api/analysis/market-prices?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("market-prices")]
    public async Task<ActionResult<List<MarketPriceDto>>> GetMarketPrices(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var from = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<_AuctionMarketRow>(
                """
                SELECT DISTINCT ON (market_code)
                       market_code AS "MarketCode",
                       price       AS "Price"
                FROM   auction_prices
                WHERE  item_code = {0}
                  AND  date BETWEEN {1} AND {2}
                  AND  price > 0
                ORDER  BY market_code, date DESC
                """,
                itemCode, from, targetDate)
            .ToListAsync();

        var result = rows
            .Select(r => new MarketPriceDto(
                r.MarketCode,
                KamisMarkets.Names.GetValueOrDefault(r.MarketCode, r.MarketCode),
                r.Price,
                null))
            .OrderByDescending(r => r.Price)
            .ToList();

        return Ok(result);
    }

    private record _AuctionMarketRow(string MarketCode, decimal Price);
}
