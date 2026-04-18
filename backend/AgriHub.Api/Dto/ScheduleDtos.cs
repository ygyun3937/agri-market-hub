namespace AgriHub.Api.Dto;
public record CreateScheduleRequest(string Title, string? Type, DateOnly Date, string? Memo);
public record UpdateScheduleRequest(string Title, string? Type, DateOnly Date, string? Memo);
public record PushSubscriptionRequest(string Endpoint, string P256Dh, string Auth);
public record UserSettingsRequest(string[] WatchRegions, string AlertThresholds);
public record WatchItemRequest(string ItemCode, string ItemName, string? MarketCode);
