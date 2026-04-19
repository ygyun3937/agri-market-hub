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
            Scopes = ["openid", "email", "profile", CalendarService.Scope.Calendar]
        });
    }

    private string RedirectUri => config["Google:RedirectUri"] ?? "https://agri.dooyg.store/api/auth/google/callback";

    public string? GetAuthUrl()
    {
        if (_flow == null) return null;
        return _flow.CreateAuthorizationCodeRequest(RedirectUri).Build().AbsoluteUri;
    }

    public record LoginTokenResult(string AccessToken, string? RefreshToken, string? IdToken);

    public async Task<LoginTokenResult?> ExchangeLoginCodeAsync(string code)
    {
        if (_flow == null) return null;
        var token = await _flow.ExchangeCodeForTokenAsync("login", code, RedirectUri, CancellationToken.None);
        return new LoginTokenResult(token.AccessToken, token.RefreshToken, token.IdToken);
    }

    public async Task SyncSchedulesAsync(int userId, List<Schedule> schedules)
    {
        logger.LogInformation("GCal sync for user {UserId}: {Count} schedules", userId, schedules.Count);
        await Task.CompletedTask;
    }
}
