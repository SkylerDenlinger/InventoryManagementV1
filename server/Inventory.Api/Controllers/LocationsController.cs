// API/Controllers/LocationsController.cs
using Inventory.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Inventory.Infrastructure.Identity;
using Inventory.Infrastructure.Persistence;

namespace Inventory.API.Controllers;

[ApiController]
[Route("api/locations")]
[Authorize]
public sealed class LocationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LocationsController(AppDbContext db) => _db = db;

    // GET /api/locations/{locationId}
    [HttpGet("{locationId:int}")]
    public async Task<ActionResult<LocationDto>> GetLocation(int locationId)
    {
        var (allowed, deny) = await AuthorizeLocationAsync(locationId);
        if (!allowed) return deny;

        var loc = await _db.Locations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == locationId);

        if (loc is null) return NotFound();

        return Ok(new LocationDto
        {
            Id = loc.Id,
            DistrictId = loc.DistrictId,
            Name = loc.Name,
            Code = loc.Code,
            Street = loc.Address.Street,
            City = loc.Address.City,
            State = loc.Address.State,
            Zip = loc.Address.Zip,
            IsActive = loc.IsActive,
            CreatedAt = loc.CreatedAt,
            UpdatedAt = loc.UpdatedAt
        });
    }

    // GET /api/locations/{locationId}/inventory
    [HttpGet("{locationId:int}/inventory")]
    public async Task<ActionResult<List<LocationInventoryItemDto>>> GetInventory(int locationId)
    {
        var (allowed, deny) = await AuthorizeLocationAsync(locationId);
        if (!allowed) return deny;

        var items = await _db.Set<LocationStock>()
            .AsNoTracking()
            .Where(x => x.LocationId == locationId)
            .Select(x => new LocationInventoryItemDto
            {
                LocationId = x.LocationId,
                ProductId = x.ProductId,
                Sku = x.Product.Sku,
                ProductName = x.Product.Name,
                QuantityOnHand = x.QuantityOnHand,
                ReorderPoint = x.ReorderPoint,
                ReorderQuantity = x.ReorderQuantity,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    // PATCH /api/locations/{locationId}/inventory/{productId} (adjust)
    [HttpPatch("{locationId:int}/inventory/{productId:int}")]
    public async Task<ActionResult<LocationInventoryItemDto>> AdjustInventory(
        int locationId,
        int productId,
        [FromBody] AdjustInventoryRequest request)
    {
        var (allowed, deny) = await AuthorizeLocationAsync(locationId);
        if (!allowed) return deny;

        // optional: lock to StoreManager only if you want; leave as is if Admin/DM can adjust too
        // if (!User.IsInRole("Admin") && !User.IsInRole("DistrictManager") && !User.IsInRole("StoreManager"))
        //     return Forbid();

        var stock = await _db.Set<LocationStock>()
            .Include(x => x.Product)
            .FirstOrDefaultAsync(x => x.LocationId == locationId && x.ProductId == productId);

        if (stock is null)
        {
            // create-on-first-adjust (optional behavior)
            if (request.CreateIfMissing != true)
                return NotFound();

            var productExists = await _db.Set<Product>().AnyAsync(p => p.Id == productId);
            if (!productExists) return NotFound($"Product {productId} not found.");

            stock = new LocationStock(locationId, productId, 0);
            _db.Add(stock);
            await _db.SaveChangesAsync();

            // re-load product for dto
            stock = await _db.Set<LocationStock>()
                .Include(x => x.Product)
                .FirstAsync(x => x.LocationId == locationId && x.ProductId == productId);
        }

        // Domain method enforces non-negative
        stock.Adjust(request.Delta);

        await _db.SaveChangesAsync();

        return Ok(new LocationInventoryItemDto
        {
            LocationId = stock.LocationId,
            ProductId = stock.ProductId,
            Sku = stock.Product.Sku,
            ProductName = stock.Product.Name,
            QuantityOnHand = stock.QuantityOnHand,
            ReorderPoint = stock.ReorderPoint,
            ReorderQuantity = stock.ReorderQuantity,
            UpdatedAt = stock.UpdatedAt
        });
    }

    // GET /api/locations/{locationId}/orders
    [HttpGet("{locationId:int}/orders")]
    public async Task<ActionResult<List<OrderListItemDto>>> GetOrders(int locationId)
    {
        var (allowed, deny) = await AuthorizeLocationAsync(locationId);
        if (!allowed) return deny;

        var orders = await _db.Set<Order>()
            .AsNoTracking()
            .Where(o => o.LocationId == locationId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListItemDto
            {
                Id = o.Id,
                LocationId = o.LocationId,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                LineCount = o.Lines.Count
            })
            .ToListAsync();

        return Ok(orders);
    }

    // POST /api/locations/{locationId}/orders
    [HttpPost("{locationId:int}/orders")]
    public async Task<ActionResult<OrderDetailsDto>> CreateOrder(int locationId, [FromBody] CreateOrderRequest request)
    {
        var (allowed, deny) = await AuthorizeLocationAsync(locationId);
        if (!allowed) return deny;

        if (request.Lines is null || request.Lines.Count == 0)
            return BadRequest("Order must contain at least one line.");

        // Ensure location exists
        var locationExists = await _db.Locations.AnyAsync(l => l.Id == locationId);
        if (!locationExists) return NotFound($"Location {locationId} not found.");

        // Optional: validate products exist
        var productIds = request.Lines.Select(l => l.ProductId).Distinct().ToList();
        var existingProducts = await _db.Set<Product>()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var missing = productIds.Except(existingProducts).ToList();
        if (missing.Count > 0)
            return BadRequest($"Missing products: {string.Join(", ", missing)}");

        var order = new Order(locationId);

        foreach (var line in request.Lines)
            order.AddLine(line.ProductId, line.Quantity, line.UnitPriceAtTime);

        _db.Add(order);
        await _db.SaveChangesAsync();

        // Return details (reload lines + product names)
        var saved = await _db.Set<Order>()
            .AsNoTracking()
            .Include(o => o.Lines)
            .ThenInclude(ol => ol.Product)
            .FirstAsync(o => o.Id == order.Id);

        var dto = new OrderDetailsDto
        {
            Id = saved.Id,
            LocationId = saved.LocationId,
            Status = saved.Status.ToString(),
            CreatedAt = saved.CreatedAt,
            UpdatedAt = saved.UpdatedAt,
            Lines = saved.Lines.Select(l => new OrderLineDto
            {
                ProductId = l.ProductId,
                Sku = l.Product.Sku,
                ProductName = l.Product.Name,
                Quantity = l.Quantity,
                UnitPriceAtTime = l.UnitPriceAtTime
            }).ToList()
        };

        return CreatedAtAction(nameof(GetOrders), new { locationId }, dto);
    }

    // -------------------------
    // Auth helper (Admin always; DistrictManager limited by districtId claim; StoreManager limited by locationId claim)
    // -------------------------
    private async Task<(bool allowed, ActionResult denyResult)> AuthorizeLocationAsync(int locationId)
    {
        if (User.IsInRole("Admin"))
            return (true, Ok());

        if (User.IsInRole("StoreManager"))
        {
            var locClaim = User.FindFirstValue("locationId");
            if (int.TryParse(locClaim, out var claimLocationId) && claimLocationId == locationId)
                return (true, Ok());

            return (false, Forbid());
        }

        if (User.IsInRole("DistrictManager"))
        {
            var districtClaim = User.FindFirstValue("districtId");
            if (!int.TryParse(districtClaim, out var claimDistrictId))
                return (false, Forbid());

            var locationDistrictId = await _db.Locations
                .Where(l => l.Id == locationId)
                .Select(l => (int?)l.DistrictId)
                .FirstOrDefaultAsync();

            if (locationDistrictId is null) return (false, NotFound());
            if (locationDistrictId.Value != claimDistrictId) return (false, Forbid());

            return (true, Ok());
        }

        return (false, Forbid());
    }

    // -------------------------
    // DTOs / Requests
    // -------------------------
    public sealed class LocationDto
    {
        public int Id { get; set; }
        public int DistrictId { get; set; }
        public string Name { get; set; } = "";
        public string? Code { get; set; }

        public string Street { get; set; } = "";
        public string City { get; set; } = "";
        public string State { get; set; } = "";
        public string Zip { get; set; } = "";

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public sealed class LocationInventoryItemDto
    {
        public int LocationId { get; set; }
        public int ProductId { get; set; }

        public string Sku { get; set; } = "";
        public string ProductName { get; set; } = "";

        public int QuantityOnHand { get; set; }
        public int? ReorderPoint { get; set; }
        public int? ReorderQuantity { get; set; }

        public DateTime UpdatedAt { get; set; }
    }

    public sealed class AdjustInventoryRequest
    {
        public int Delta { get; set; }
        public bool? CreateIfMissing { get; set; } = true;
    }

    public sealed class OrderListItemDto
    {
        public int Id { get; set; }
        public int LocationId { get; set; }
        public string Status { get; set; } = "";
        public int LineCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public sealed class CreateOrderRequest
    {
        public List<CreateOrderLineRequest> Lines { get; set; } = new();
    }

    public sealed class CreateOrderLineRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitPriceAtTime { get; set; }
    }

    public sealed class OrderDetailsDto
    {
        public int Id { get; set; }
        public int LocationId { get; set; }
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<OrderLineDto> Lines { get; set; } = new();
    }

    public sealed class OrderLineDto
    {
        public int ProductId { get; set; }
        public string Sku { get; set; } = "";
        public string ProductName { get; set; } = "";
        public int Quantity { get; set; }
        public decimal? UnitPriceAtTime { get; set; }
    }
}
