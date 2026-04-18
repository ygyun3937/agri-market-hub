using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/prices")]
[Authorize]
public class PricesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PriceDto>>> GetPrices(
        [FromQuery] string? market, [FromQuery] bool seasonal = false)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);

        var query = db.AuctionPrices.Where(p => p.Date >= yesterday);
        if (!string.IsNullOrEmpty(market))
            query = query.Where(p => p.MarketCode == market);

        var prices = await query
            .OrderByDescending(p => p.Date)
            .Take(50)
            .ToListAsync();

        var itemCodes = prices.Select(p => p.ItemCode).Distinct().ToList();
        var prevPrices = await db.AuctionPrices
            .Where(p => itemCodes.Contains(p.ItemCode) && p.Date == today.AddDays(-2))
            .ToListAsync();
        var prevMap = prevPrices
            .GroupBy(p => (p.ItemCode, p.MarketCode))
            .ToDictionary(g => g.Key, g => g.First().Price);

        var result = prices.Select(p =>
        {
            decimal? change = null;
            if (prevMap.TryGetValue((p.ItemCode, p.MarketCode), out var prev) && prev != 0)
                change = Math.Round((p.Price - prev) / prev * 100, 1);
            return new PriceDto(p.ItemCode, p.MarketCode, p.Price, p.Volume, p.Grade, p.Date, change);
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{itemCode}/chart")]
    public async Task<ActionResult<List<ChartPointDto>>> GetChart(
        string itemCode, [FromQuery] string period = "7d")
    {
        var days = period switch { "30d" => 30, "90d" => 90, _ => 7 };
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var points = await db.AuctionPrices
            .Where(p => p.ItemCode == itemCode && p.Date >= from)
            .OrderBy(p => p.Date)
            .Select(p => new ChartPointDto(p.Date, p.Price))
            .ToListAsync();
        return Ok(points);
    }
}
