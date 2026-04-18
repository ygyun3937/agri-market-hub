using StackExchange.Redis;
using System.Text.Json;

namespace AgriHub.Api.Services;

public class CacheService(IConnectionMultiplexer? redis = null)
{
    private readonly IDatabase? _db = redis?.GetDatabase();

    public async Task<T?> GetAsync<T>(string key)
    {
        if (_db == null) return default;
        var value = await _db.StringGetAsync(key);
        return value.IsNull ? default : JsonSerializer.Deserialize<T>((string)value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
    {
        if (_db == null) return;
        await _db.StringSetAsync(key, JsonSerializer.Serialize(value), expiry);
    }
}
