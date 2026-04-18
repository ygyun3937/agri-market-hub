namespace AgriHub.Api.Dto;
public record PriceDto(string ItemCode, string MarketCode, decimal Price,
    decimal? Volume, string? Grade, DateOnly Date, decimal? ChangePercent);
public record ChartPointDto(DateOnly Date, decimal Price);
