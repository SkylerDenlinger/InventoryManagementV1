// Domain/Entities/OrderLine.cs
namespace Inventory.Domain.Entities;

public class OrderLine
{
    public int Id { get; private set; }

    public int OrderId { get; private set; }
    public Order Order { get; private set; } = null!; // EF nav

    public int ProductId { get; private set; }
    public Product Product { get; private set; } = null!; // EF nav

    public int Quantity { get; private set; }

    public decimal? UnitPriceAtTime { get; private set; }

    private OrderLine() { } // EF

    public OrderLine(int orderId, int productId, int quantity, decimal? unitPriceAtTime = null)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be > 0.");

        OrderId = orderId;
        ProductId = productId;
        Quantity = quantity;
        UnitPriceAtTime = unitPriceAtTime;
    }

    public void IncreaseQuantity(int delta)
    {
        if (delta <= 0)
            throw new ArgumentOutOfRangeException(nameof(delta), "Delta must be > 0.");

        Quantity += delta;
    }
}
