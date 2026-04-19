using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using AgriHub.Api.Dto;
using AgriHub.Api.Services;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, GoogleCalendarService gcal, IConfiguration config, IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Email and password required");
        var user = await auth.RegisterAsync(req.Email, req.Password, req.Name);
        if (user == null) return Conflict("Email already registered");
        return Ok(new AuthResponse(auth.GenerateToken(user), user.Name, user.Id));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await auth.ValidateAsync(req.Email, req.Password);
        if (user == null) return Unauthorized("Invalid credentials");
        return Ok(new AuthResponse(auth.GenerateToken(user), user.Name, user.Id));
    }

    [HttpPost("logout")]
    public IActionResult Logout() => Ok();

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleAuthRequest req)
    {
        var http = httpClientFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", req.AccessToken);
        var resp = await http.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
        if (!resp.IsSuccessStatusCode) return Unauthorized("Invalid Google token");
        var info = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var googleId = info.GetProperty("sub").GetString()!;
        var email = info.GetProperty("email").GetString()!;
        var name = info.TryGetProperty("name", out var n) ? n.GetString() ?? email.Split('@')[0] : email.Split('@')[0];
        var user = await auth.GoogleLoginAsync(googleId, email, name, null);
        return Ok(new AuthResponse(auth.GenerateToken(user), user.Name, user.Id));
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string state)
    {
        var accessToken = await gcal.ExchangeCodeAsync(code);
        if (accessToken == null) return BadRequest("Google Calendar not configured");
        return Redirect("/?gcal=connected");
    }
}
