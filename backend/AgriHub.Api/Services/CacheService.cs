using StackExchange.Redis;

namespace AgriHub.Api.Services;

public class CacheService(IConnectionMultiplexer? redis = null) { }
