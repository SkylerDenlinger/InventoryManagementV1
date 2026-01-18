using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Inventory.Infrastructure.Identity; // adjust namespace
using Inventory.Infrastructure.Persistence; // DbContext namespace

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // 1. Ensure Admin role exists
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        // 2. Ensure admin user exists
        var adminEmail = "admin@local.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                DistrictId = null,
                LocationId = null
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");

            if (!result.Succeeded)
            {
                throw new Exception(
                    "Failed to create admin user: " +
                    string.Join(", ", result.Errors.Select(e => e.Description))
                );
            }
        }

        // 3. Ensure admin user has Admin role
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}
