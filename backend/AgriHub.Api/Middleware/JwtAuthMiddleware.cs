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
                ctx.Items["UserId"] = int.Parse(userId);
        }
        await next(ctx);
    }
}
