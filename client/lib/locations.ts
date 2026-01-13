// lib/locations.ts
import type { Location } from "@/types/location";

// This represents what your backend actually returns (adjust fields to match)
type LocationDto = {
  id: number;
  name: string;
  code: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  isActive: boolean;
  // ...maybe other backend-only fields
};

function toLocation(dto: LocationDto): Location {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    addressLine1: dto.addressLine1 ?? undefined,
    city: dto.city ?? undefined,
    state: dto.state ?? undefined,
    isActive: dto.isActive,
  };
}

export async function fetchLocations(): Promise<Location[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations`, {
    // if your backend needs cookies/auth you may need credentials/headers here
    cache: "no-store", // always fresh (good during dev)
  });

  if (!res.ok) {
    // you can improve this later with better error handling
    throw new Error(`Failed to fetch locations: ${res.status}`);
  }

  const data: LocationDto[] = await res.json();
  return data.map(toLocation);
}
