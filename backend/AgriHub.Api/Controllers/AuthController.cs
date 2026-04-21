using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using AgriHub.Api.Dto;
using AgriHub.Api.Services;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, IConfiguration config, IHttpClientFactory http, ILogger<AuthController> logger) : ControllerBase
{
    private string RedirectUri => config["Google:RedirectUri"] ?? "https://agri.dooyg.store/api/auth/google/callback";
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

    [HttpGet("google/redirect")]
    public IActionResult GoogleRedirect()
    {
        var clientId = config["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId)) return BadRequest("Google not configured");
        var url = "https://accounts.google.com/o/oauth2/v2/auth" +
            $"?client_id={Uri.EscapeDataString(clientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}" +
            "&response_type=code" +
            "&scope=openid%20email%20profile" +
            "&access_type=online";
        return Redirect(url);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code)
    {
        try { return await GoogleCallbackCore(code); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Google OAuth callback failed");
            return Redirect("/login?error=1");
        }
    }

    private async Task<IActionResult> GoogleCallbackCore(string code)
    {
        var clientId = config["Google:ClientId"];
        var clientSecret = config["Google:ClientSecret"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            return Redirect("/login?error=1");

        var client = http.CreateClient();
        var tokenResp = await client.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = RedirectUri,
                ["grant_type"] = "authorization_code",
            }));
        if (!tokenResp.IsSuccessStatusCode) return Redirect("/login?error=1");

        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<JsonElement>();
        var idToken = tokenJson.GetProperty("id_token").GetString();
        var refreshToken = tokenJson.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });
        }
        catch { return Redirect("/login?error=1"); }

        var user = await auth.GoogleLoginAsync(
            payload.Subject, payload.Email,
            payload.Name ?? payload.Email.Split('@')[0], refreshToken);
        var jwt = auth.GenerateToken(user);
        var name = Uri.EscapeDataString(user.Name);
        return Redirect($"/login?token={jwt}&name={name}");
    }
}
