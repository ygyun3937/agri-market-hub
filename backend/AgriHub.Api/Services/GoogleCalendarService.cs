using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Calendar.v3;
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
            Scopes = [CalendarService.Scope.Calendar]
        });
    }

    public string? GetAuthUrl(string userId)
    {
        if (_flow == null) return null;
        return _flow.CreateAuthorizationCodeRequest(config["Google:RedirectUri"]!)
            .Build().AbsoluteUri + $"&state={userId}";
    }

    public async Task<string?> ExchangeCodeAsync(string code)
    {
        if (_flow == null) return null;
        var token = await _flow.ExchangeCodeForTokenAsync("user", code,
            config["Google:RedirectUri"]!, CancellationToken.None);
        return token.AccessToken;
    }

    public record LoginTokenResult(string AccessToken, string? RefreshToken, string? IdToken);

    public async Task<LoginTokenResult?> ExchangeLoginCodeAsync(string code)
    {
        if (_flow == null) return null;
        var token = await _flow.ExchangeCodeForTokenAsync("login", code, "postmessage", CancellationToken.None);
        return new LoginTokenResult(token.AccessToken, token.RefreshToken, token.IdToken);
    }

    public async Task SyncSchedulesAsync(int userId, List<Schedule> schedules)
    {
        logger.LogInformation("GCal sync for user {UserId}: {Count} schedules", userId, schedules.Count);
        await Task.CompletedTask;
    }
}
