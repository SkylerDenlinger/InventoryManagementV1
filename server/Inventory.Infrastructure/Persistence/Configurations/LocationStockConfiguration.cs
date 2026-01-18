using Inventory.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventory.Infrastructure.Persistence.Configurations;

public sealed class LocationStockConfiguration : IEntityTypeConfiguration<LocationStock>
{
    public void Configure(EntityTypeBuilder<LocationStock> builder)
    {
        builder.ToTable("LocationStocks");

        // Composite PK
        builder.HasKey(x => new { x.LocationId, x.ProductId });

        builder.Property(x => x.QuantityOnHand).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasOne(x => x.Location)
            .WithMany()
            .HasForeignKey(x => x.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
