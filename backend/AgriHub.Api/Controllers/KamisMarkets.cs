// backend/AgriHub.Api/Controllers/KamisMarkets.cs
namespace AgriHub.Api.Controllers;

public record MarketPriceDto(string MarketCode, string MarketName, decimal Price, string? Unit);

internal static class KamisMarkets
{
    public static readonly Dictionary<string, string> Names = new()
    {
        ["1101"] = "서울 가락",
        ["1102"] = "서울 강서",
        ["2100"] = "부산 엄궁",
        ["2200"] = "대구 북부",
        ["2300"] = "광주 각화",
        ["2400"] = "대전 오정",
        ["3212"] = "구리",
        ["3211"] = "인천 삼산",
    };
}
