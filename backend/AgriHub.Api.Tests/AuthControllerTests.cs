using System.Net;
using System.Net.Http.Json;
using AgriHub.Api.Dto;
using AgriHub.Api.Tests.TestHelpers;
using FluentAssertions;

public class AuthControllerTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_ValidData_Returns200WithToken()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("test@example.com", "password123", "홍길동"));
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Token.Should().NotBeNullOrEmpty();
        body.Name.Should().Be("홍길동");
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("dup@example.com", "pass", "User"));
        var res = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("dup@example.com", "pass", "User2"));
        res.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_CorrectCredentials_Returns200WithToken()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("login@example.com", "secret", "테스트"));
        var res = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("login@example.com", "secret"));
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("wrong@example.com", "correct", "User"));
        var res = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("wrong@example.com", "incorrect"));
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
