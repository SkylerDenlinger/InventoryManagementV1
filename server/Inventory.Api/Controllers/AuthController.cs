using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Inventory.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    public record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // 1) TEMPORARY DEV CHECK (replace with DB + password hashing next step)
        // Pick any credentials you want for now.
        var isValidUser =
            request.Email == "admin@test.com" &&
            request.Password == "Password123!";

        if (!isValidUser)
            return Unauthorized(new { message = "Invalid credentials" });

        // 2) Read Jwt config (must match your validation settings)
        var jwtSection = _config.GetSection("Jwt");
        var issuer = jwtSection["Issuer"];
        var audience = jwtSection["Audience"];
        var key = jwtSection["Key"];

        // 3) Build claims for this user
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, "123"),     // user id
            new Claim(ClaimTypes.Role, "Admin"),               // role
            new Claim("locationId", "12")                      // example custom claim
        };

        // 4) Sign token (HS256)
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        // 5) Create token
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new { accessToken = tokenString });
    }
}
