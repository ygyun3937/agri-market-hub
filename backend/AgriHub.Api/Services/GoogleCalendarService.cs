using AgriHub.Api.Models;

namespace AgriHub.Api.Services;

public class GoogleCalendarService(IConfiguration config, ILogger<GoogleCalendarService> logger)
{
    public async Task SyncSchedulesAsync(int userId, List<Schedule> schedules)
    {
        // Full implementation in Task 16
        await Task.CompletedTask;
    }
}
