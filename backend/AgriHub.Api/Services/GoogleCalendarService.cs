using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using AgriHub.Api.Models;

namespace AgriHub.Api.Services;

public class GoogleCalendarService(IConfiguration config, ILogger<GoogleCalendarService> logger)
{
    private readonly GoogleAuthorizationCodeFlow? _flow = TryCreateFlow(config);

    private static GoogleAuthorizationCodeFlow? TryCreateFlow(IConfiguration config)
    {
        var clientId = config["Google:ClientId"];
        var clientSecret = config["Google:ClientSecret"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret)) return null;
        return new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets { ClientId = clientId, ClientSecret = clientSecret },
            Scopes = ["openid", "email", "profile", CalendarService.Scope.Calendar]
        });
    }

    private CalendarService? GetCalendarService(string refreshToken)
    {
        if (_flow == null) return null;
        var credential = new UserCredential(_flow, "user", new TokenResponse { RefreshToken = refreshToken });
        return new CalendarService(new BaseClientService.Initializer { HttpClientInitializer = credential });
    }

    public async Task<string?> CreateEventAsync(User user, Schedule schedule)
    {
        if (string.IsNullOrEmpty(user.GoogleRefreshToken)) return null;
        var svc = GetCalendarService(user.GoogleRefreshToken);
        if (svc == null) return null;
        try
        {
            var dateStr = schedule.Date.ToString("yyyy-MM-dd");
            var ev = new Event
            {
                Summary = schedule.Title,
                Description = schedule.Memo,
                Start = new EventDateTime { Date = dateStr },
                End = new EventDateTime { Date = dateStr }
            };
            var created = await svc.Events.Insert(ev, "primary").ExecuteAsync();
            return created.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GCal create event failed for user {UserId}", user.Id);
            return null;
        }
    }

    public async Task DeleteEventAsync(User user, string? eventId)
    {
        if (string.IsNullOrEmpty(user.GoogleRefreshToken) || string.IsNullOrEmpty(eventId)) return;
        var svc = GetCalendarService(user.GoogleRefreshToken);
        if (svc == null) return;
        try
        {
            await svc.Events.Delete("primary", eventId).ExecuteAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GCal delete event {EventId} failed for user {UserId}", eventId, user.Id);
        }
    }

    public async Task<List<object>> GetUpcomingEventsAsync(User user, int days = 30)
    {
        if (string.IsNullOrEmpty(user.GoogleRefreshToken)) return [];
        var svc = GetCalendarService(user.GoogleRefreshToken);
        if (svc == null) return [];
        try
        {
            var req = svc.Events.List("primary");
            req.TimeMinDateTimeOffset = DateTimeOffset.UtcNow;
            req.TimeMaxDateTimeOffset = DateTimeOffset.UtcNow.AddDays(days);
            req.SingleEvents = true;
            req.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;
            req.MaxResults = 50;
            var result = await req.ExecuteAsync();
            return result.Items?
                .Where(e => e.Start?.Date != null || e.Start?.DateTime != null)
                .Select(e => (object)new {
                    id = "gcal_" + e.Id,
                    title = e.Summary ?? "(제목 없음)",
                    date = e.Start?.Date ?? e.Start?.DateTimeDateTimeOffset?.ToString("yyyy-MM-dd"),
                    memo = e.Description,
                    gcalEventId = e.Id,
                    fromGcal = true
                }).ToList() ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GCal get events failed for user {UserId}", user.Id);
            return [];
        }
    }

    public async Task SyncSchedulesAsync(int userId, List<Schedule> schedules)
    {
        logger.LogInformation("GCal sync for user {UserId}: {Count} schedules", userId, schedules.Count);
        await Task.CompletedTask;
    }
}
