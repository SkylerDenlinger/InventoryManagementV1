using Inventory.Domain.ValueObjects;

namespace Inventory.Domain.Entities;

public class Location
{
    public int Id { get; private set; }
    public int DistrictId { get; private set; }

    public string Name { get; private set; } = null!;
    public string? Code { get; private set; }

    public Address Address { get; private set; } = null!;

    public bool IsActive { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // EF Core
    private Location() { }

    public Location(
        int districtId,
        string name,
        Address address,
        string? code = null)
    {
        DistrictId = districtId;
        Name = name;
        Code = code;

        Address = address;

        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateName(string name)
    {
        Name = name;
        Touch();
    }

    // Replace the value object (don’t mutate it)
    public void UpdateAddress(Address address)
    {
        Address = address;
        Touch();
    }

    public void Deactivate()
    {
        IsActive = false;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
