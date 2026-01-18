namespace Inventory.Infrastructure.Identity;

using Microsoft.AspNetCore.Identity;

public class AppUser : IdentityUser
{

    public int? DistrictId { get; set; }
    public int? LocationId { get; set; }
}
