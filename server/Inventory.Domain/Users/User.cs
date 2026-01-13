namespace Inventory.Domain.Users;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Role { get; set; } = "StoreManager";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
