using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Inventory.Infrastructure.Identity;

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

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.UserName,
                u.DistrictId,
                u.LocationId
            })
            .ToListAsync();

        // Roles require hitting UserManager; simplest is per-user.
        // (You can optimize later.)
        var result = new List<object>(users.Count);

        foreach (var u in users)
        {
            var user = await _userManager.FindByIdAsync(u.Id);
            var roles = user is null ? new List<string>() : (await _userManager.GetRolesAsync(user)).ToList();

            result.Add(new
            {
                u.Id,
                u.Email,
                u.UserName,
                u.DistrictId,
                u.LocationId,
                roles
            });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        // 0) Basic request validation
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Password is required." });

        if (string.IsNullOrWhiteSpace(request.Role))
            return BadRequest(new { message = "Role is required." });

        // 1) Ensure role exists
        var roleExists = await _roleManager.RoleExistsAsync(request.Role);
        if (!roleExists)
            return BadRequest(new { message = $"Role '{request.Role}' does not exist." });

        // 2) Ensure email not in use
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
            return Conflict(new { message = "Email already in use." });

        // 3) Enforce role -> scope rules
        var normalizedRole = request.Role.Trim();

        // Default: allow nulls if not provided
        int? districtId = request.DistrictId;
        int? locationId = request.LocationId;

        switch (normalizedRole)
        {
            case "Admin":
                if (districtId != null || locationId != null)
                    return BadRequest(new { message = "Admin users must not have DistrictId or LocationId." });
                break;

            case "DistrictManager":
                if (districtId == null)
                    return BadRequest(new { message = "DistrictManager must have DistrictId." });
                if (locationId != null)
                    return BadRequest(new { message = "DistrictManager must not have LocationId." });
                break;

            case "StoreManager":
                if (request.DistrictId == null)
                    return BadRequest(new { message = "StoreManager must have DistrictId." });

                if (request.LocationId == null)
                    return BadRequest(new { message = "StoreManager must have LocationId." });
                break;

            default:
                // If you only allow these three roles, reject anything else.
                return BadRequest(new { message = "Role must be one of: Admin, DistrictManager, StoreManager." });
        }

        // 4) Create user with scope fields set
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            DistrictId = districtId,
            LocationId = locationId
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

        // 5) Assign role
        var roleResult = await _userManager.AddToRoleAsync(user, normalizedRole);
        if (!roleResult.Succeeded)
        {
            // Rollback user if role assignment fails (keeps DB clean)
            await _userManager.DeleteAsync(user);

            return BadRequest(new
            {
                message = "Role assignment failed.",
                errors = roleResult.Errors.Select(e => e.Description)
            });
        }

        return Created("", new
        {
            user.Id,
            user.Email,
            role = normalizedRole,
            user.DistrictId,
            user.LocationId
        });
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser([FromRoute] string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { message = "userId is required." });

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        // Optional safety: prevent admin from deleting themselves
        var currentUserId = _userManager.GetUserId(User);
        if (!string.IsNullOrWhiteSpace(currentUserId) && currentUserId == userId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "User deletion failed.",
                errors = result.Errors.Select(e => e.Description)
            });
        }

        return NoContent();
    }
}

/// <summary>
/// POST body for creating an Identity user via admin.
/// </summary>
public sealed class CreateUserRequest
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
    public string Role { get; init; } = "";

    public int? DistrictId { get; init; }
    public int? LocationId { get; init; }
}
