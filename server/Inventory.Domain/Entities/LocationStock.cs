// Domain/Entities/LocationStock.cs
namespace Inventory.Domain.Entities;

public class LocationStock
{
    public int LocationId { get; private set; }
    public int ProductId { get; private set; }

    public int QuantityOnHand { get; private set; }

    public int? ReorderPoint { get; private set; }
    public int? ReorderQuantity { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    // Optional navigations (EF)
    public Location Location { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    private LocationStock() { } // EF

    public LocationStock(int locationId, int productId, int quantityOnHand,
        int? reorderPoint = null, int? reorderQuantity = null)
    {
        LocationId = locationId;
        ProductId = productId;

        SetQuantity(quantityOnHand);

        ReorderPoint = reorderPoint;
        ReorderQuantity = reorderQuantity;

        UpdatedAt = DateTime.UtcNow;
    }

    public void SetQuantity(int quantityOnHand)
    {
        if (quantityOnHand < 0)
            throw new ArgumentOutOfRangeException(nameof(quantityOnHand), "Quantity cannot be negative.");

        QuantityOnHand = quantityOnHand;
        Touch();
    }

    public void Adjust(int delta)
    {
        var next = QuantityOnHand + delta;
        if (next < 0)
            throw new InvalidOperationException("Stock cannot go below zero.");

        QuantityOnHand = next;
        Touch();
    }

    public void SetReorder(int? reorderPoint, int? reorderQuantity)
    {
        ReorderPoint = reorderPoint;
        ReorderQuantity = reorderQuantity;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
