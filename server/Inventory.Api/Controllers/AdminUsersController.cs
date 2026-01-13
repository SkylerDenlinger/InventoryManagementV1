using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AdminUsersController(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        // 1) Ensure role exists
        var roleExists = await _roleManager.RoleExistsAsync(request.Role);
        if (!roleExists)
            return BadRequest(new { message = $"Role '{request.Role}' does not exist." });

        // 2) Ensure email not in use
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
            return Conflict(new { message = "Email already in use." });

        // 3) Create user
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message = "User creation failed.",
                errors = createResult.Errors.Select(e => e.Description)
            });
        }

        // 4) Assign role
        var roleResult = await _userManager.AddToRoleAsync(user, request.Role);
        if (!roleResult.Succeeded)
        {
            return BadRequest(new
            {
                message = "Role assignment failed.",
                errors = roleResult.Errors.Select(e => e.Description)
            });
        }

        return Created("", new { user.Id, user.Email, role = request.Role });
    }
}
