// Domain/Entities/Product.cs
namespace Inventory.Domain.Entities;

public class Product
{
    public int Id { get; private set; }

    public string Sku { get; private set; } = null!;
    public string Name { get; private set; } = null!;

    public bool IsActive { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Product() { } // EF

    public Product(string sku, string name)
    {
        Sku = sku.Trim();
        Name = name.Trim();

        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateName(string name)
    {
        Name = name.Trim();
        Touch();
    }

    public void Deactivate()
    {
        IsActive = false;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
