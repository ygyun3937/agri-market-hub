using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/weather")]
public class WeatherController(AppDbContext db) : ControllerBase
{
    [HttpGet("{regionCode}")]
    public async Task<ActionResult<WeatherDto>> GetCurrent(string regionCode)
    {
        var w = await db.WeatherData
            .Where(x => x.RegionCode == regionCode)
            .OrderByDescending(x => x.CollectedAt)
            .FirstOrDefaultAsync();
        if (w == null) return NotFound();
        return Ok(new WeatherDto(w.RegionCode, w.Temp, w.Rain, w.Humidity, w.Wind, w.Snow, w.CollectedAt));
    }

    [HttpGet("{regionCode}/forecast")]
    public async Task<ActionResult<List<ForecastDto>>> GetForecast(string regionCode)
    {
        var kstNow = DateTime.UtcNow.AddHours(9);
        var forecasts = await db.WeatherForecasts
            .Where(f => f.RegionCode == regionCode && f.ForecastDate >= DateOnly.FromDateTime(kstNow))
            .OrderBy(f => f.ForecastDate)
            .Take(5)
            .Select(f => new ForecastDto(f.ForecastDate, f.Icon, f.High, f.Low, f.RainProb))
            .ToListAsync();
        return Ok(forecasts);
    }
}
