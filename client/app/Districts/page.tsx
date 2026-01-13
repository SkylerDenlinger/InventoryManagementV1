// app/Districts/Locations/page.tsx
import { fetchLocations } from "@/lib/locations";

export default async function LocationsPage() {
  const locations = await fetchLocations();

  return (
    <main>
      <h1>Locations</h1>

      <ul>
        {locations.map(loc => (
          <li key={loc.id}>
            <div>{loc.name} ({loc.code})</div>
            <div>
              {[loc.addressLine1, loc.city, loc.state].filter(Boolean).join(", ")}
            </div>
            {!loc.isActive && <small>Inactive</small>}
          </li>
        ))}
      </ul>
    </main>
  );
}