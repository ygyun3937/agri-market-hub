using WebPush;
using AgriHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriHub.Api.Services;

public class PushService(IConfiguration config, ILogger<PushService> logger)
{
    private readonly VapidDetails? _vapid = TryCreateVapid(config);

    private static VapidDetails? TryCreateVapid(IConfiguration config)
    {
        var subject = config["VapidSubject"];
        var publicKey = config["VapidPublicKey"];
        var privateKey = config["VapidPrivateKey"];
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey)) return null;
        return new VapidDetails(subject ?? "mailto:admin@agrihub.local", publicKey, privateKey);
    }

    public async Task SendAsync(AppDbContext db, int userId, string title, string body)
    {
        if (_vapid == null)
        {
            logger.LogWarning("VAPID keys not configured, skipping push notification");
            return;
        }

        var subscriptions = await db.PushSubscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var client = new WebPushClient();
        var payload = System.Text.Json.JsonSerializer.Serialize(new { title, body });

        foreach (var sub in subscriptions)
        {
            try
            {
                var subscription = new PushSubscription(sub.Endpoint, sub.P256Dh, sub.Auth);
                await client.SendNotificationAsync(subscription, payload, _vapid);
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone)
            {
                db.PushSubscriptions.Remove(sub);
                logger.LogInformation("Removed expired push subscription {Id}", sub.Id);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Push failed for subscription {Id}", sub.Id);
            }
        }
        await db.SaveChangesAsync();
    }
}
