using System.Security.Claims;

namespace AgriHub.Api.Middleware;

public class JwtAuthMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var userId = ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
                if (int.TryParse(userId, out var id)) ctx.Items["UserId"] = id;
        }
        await next(ctx);
    }
}
