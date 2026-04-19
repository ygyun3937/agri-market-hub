using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using AgriHub.Api.Dto;
using AgriHub.Api.Services;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, GoogleCalendarService gcal, IConfiguration config) : ControllerBase
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

    [HttpGet("google/redirect")]
    public IActionResult GoogleRedirect()
    {
        var url = gcal.GetAuthUrl();
        if (url == null) return BadRequest("Google not configured");
        return Redirect(url);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code)
    {
        GoogleCalendarService.LoginTokenResult? tokens;
        try { tokens = await gcal.ExchangeLoginCodeAsync(code); }
        catch { return Redirect("/login?error=1"); }
        if (tokens == null) return Redirect("/login?error=1");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(tokens.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [config["Google:ClientId"]!] });
        }
        catch { return Redirect("/login?error=1"); }

        var user = await auth.GoogleLoginAsync(
            payload.Subject, payload.Email,
            payload.Name ?? payload.Email.Split('@')[0], tokens.RefreshToken);
        var jwt = auth.GenerateToken(user);
        var name = Uri.EscapeDataString(user.Name);
        return Redirect($"/login?token={jwt}&name={name}");
    }
}
