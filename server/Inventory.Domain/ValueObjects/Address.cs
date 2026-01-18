namespace Inventory.Domain.ValueObjects;

public sealed class Address
{
    public string Street { get; }
    public string City { get; }
    public string State { get; }
    public string Zip { get; }

    // EF Core
    private Address() { }

    public Address(string street, string city, string state, string zip)
    {
        Street = street.Trim();
        City   = city.Trim();
        State  = state.Trim();
        Zip    = zip.Trim();
    }
}
