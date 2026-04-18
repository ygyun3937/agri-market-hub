using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using AgriHub.Api.Data;
using AgriHub.Api.Hubs;
using AgriHub.Api.Models;

namespace AgriHub.Api.Services;

public class SmartAlertService(
    IServiceScopeFactory scopeFactory,
    IHubContext<DashboardHub> hub,
    PushService push,
    ILogger<SmartAlertService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await CheckAllAsync(); }
            catch (Exception ex) { logger.LogError(ex, "Smart alert check failed"); }
            try { await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task CheckAllAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await CheckDisasterAlertsAsync(db);
        await CheckPriceDropsAsync(db);
        await CheckScheduleWeatherAsync(db);
    }

    private async Task CheckDisasterAlertsAsync(AppDbContext db)
    {
        var activeAlerts = await db.DisasterAlerts
            .Where(a => a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(a => a.IssuedAt)
            .Take(1)
            .ToListAsync();

        if (activeAlerts.Count > 0)
            await hub.Clients.All.SendAsync("AlertUpdate", activeAlerts.First());
    }

    private async Task CheckPriceDropsAsync(AppDbContext db)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);
        var twoDaysAgo = today.AddDays(-2);

        var todayPrices = await db.AuctionPrices.Where(p => p.Date == today).ToListAsync();
        if (todayPrices.Count == 0) return;

        var prevPrices = await db.AuctionPrices
            .Where(p => p.Date == yesterday || p.Date == twoDaysAgo)
            .GroupBy(p => p.ItemCode)
            .Select(g => new { ItemCode = g.Key, Price = g.Max(p => p.Price) })
            .ToListAsync();
        var prevMap = prevPrices.ToDictionary(p => p.ItemCode, p => p.Price);

        var users = await db.Users.Include(u => u.Settings).ToListAsync();

        foreach (var price in todayPrices)
        {
            if (!prevMap.TryGetValue(price.ItemCode, out var prev) || prev == 0) continue;
            var changePercent = (price.Price - prev) / prev * 100;

            foreach (var user in users)
            {
                var threshold = -5m;
                if (user.Settings?.AlertThresholds != null)
                {
                    try
                    {
                        var el = JsonSerializer.Deserialize<JsonElement>(user.Settings.AlertThresholds);
                        if (el.TryGetProperty("priceDropPercent", out var t))
                            threshold = -Math.Abs(t.GetDecimal());
                    }
                    catch { }
                }

                if (changePercent <= threshold)
                {
                    var notif = new Notification
                    {
                        UserId = user.Id, Type = "price_drop",
                        Title = "📉 가격 급락 감지",
                        Body = $"{price.ItemCode} {changePercent:F1}% 하락",
                        IsRead = false, CreatedAt = DateTime.UtcNow
                    };
                    db.Notifications.Add(notif);
                    await push.SendAsync(db, user.Id, notif.Title!, notif.Body!);
                }
            }
        }
        await db.SaveChangesAsync();
    }

    private async Task CheckScheduleWeatherAsync(AppDbContext db)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todaySchedules = await db.Schedules
            .Include(s => s.User)
            .Where(s => s.Date == today)
            .ToListAsync();

        foreach (var schedule in todaySchedules)
        {
            var weather = await db.WeatherForecasts
                .Where(f => f.ForecastDate == today)
                .FirstOrDefaultAsync();

            if (weather?.RainProb >= 70 || weather?.Icon == "rainy")
            {
                var notif = new Notification
                {
                    UserId = schedule.UserId, Type = "schedule_weather",
                    Title = "🚨 출하 위험",
                    Body = $"'{schedule.Title}' 일정 당일 악천후 예보 — 재검토 권고",
                    IsRead = false, CreatedAt = DateTime.UtcNow
                };
                db.Notifications.Add(notif);
                await push.SendAsync(db, schedule.UserId, notif.Title!, notif.Body!);
            }
        }
        await db.SaveChangesAsync();
    }
}
