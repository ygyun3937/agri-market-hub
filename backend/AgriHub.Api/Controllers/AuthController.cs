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

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleAuthRequest req)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [config["Google:ClientId"]!] });
        }
        catch (Exception ex) { return Unauthorized(new { error = "Invalid Google token", detail = ex.Message }); }
        var user = await auth.GoogleLoginAsync(
            payload.Subject, payload.Email,
            payload.Name ?? payload.Email.Split('@')[0], null);
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
