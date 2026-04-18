using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;
using AgriHub.Api.Models;
using AgriHub.Api.Tests.TestHelpers;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

public class WeatherControllerTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<string> GetTokenAsync(string email = "weather@example.com")
    {
        var res = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "pass", "User"));
        if (!res.IsSuccessStatusCode)
        {
            var loginRes = await _client.PostAsJsonAsync("/api/auth/login",
                new LoginRequest(email, "pass"));
            var loginBody = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
            return loginBody!.Token;
        }
        var body = await res.Content.ReadFromJsonAsync<AuthResponse>();
        return body!.Token;
    }

    [Fact]
    public async Task GetCurrent_WithData_Returns200()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.WeatherData.Add(new WeatherData
        {
            RegionCode = "11B10101",
            Temp = 18.5m,
            Humidity = 65,
            CollectedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var token = await GetTokenAsync("weathertest1@example.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var res = await _client.GetAsync("/api/weather/11B10101");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<WeatherDto>();
        body!.Temp.Should().Be(18.5m);
    }

    [Fact]
    public async Task GetCurrent_NoData_Returns404()
    {
        var token = await GetTokenAsync("weathertest2@example.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var res = await _client.GetAsync("/api/weather/UNKNOWN_REGION_XYZ");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
