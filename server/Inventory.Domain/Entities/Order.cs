// Domain/Entities/Order.cs
namespace Inventory.Domain.Entities;

using System.Linq;

public class Order
{
    public int Id { get; private set; }

    public int LocationId { get; private set; }
    public Location Location { get; private set; } = null!; // EF nav

    public OrderStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<OrderLine> _lines = new();
    public IReadOnlyCollection<OrderLine> Lines => _lines.AsReadOnly();

    private Order() { } // EF

    public Order(int locationId)
    {
        LocationId = locationId;
        Status = OrderStatus.Pending;

        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddLine(int productId, int quantity, decimal? unitPriceAtTime = null)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Can only add lines to a pending order.");

        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be > 0.");

        var existing = _lines.FirstOrDefault(x => x.ProductId == productId);
        if (existing is not null)
        {
            existing.IncreaseQuantity(quantity);
        }
        else
        {
            _lines.Add(new OrderLine(Id, productId, quantity, unitPriceAtTime));
        }

        Touch();
    }

    public void MarkFulfilled()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Only pending orders can be fulfilled.");

        Status = OrderStatus.Fulfilled;
        Touch();
    }

    public void Cancel()
    {
        if (Status == OrderStatus.Fulfilled)
            throw new InvalidOperationException("Fulfilled orders cannot be cancelled.");

        Status = OrderStatus.Cancelled;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
