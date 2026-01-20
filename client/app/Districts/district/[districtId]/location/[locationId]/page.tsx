// app/districts/district/[districtId]/location/[locationId]/page.tsx
import LocationClient from "@/app/districts/district/[districtId]/location/[locationId]/locationClient";
import styles from "./page.module.css";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ districtId: string; locationId: string }>;
}) {
  const { districtId, locationId } = await params;

  // pass only primitives (plain values) to the client component
  return <LocationClient districtId={districtId} locationId={locationId} />;
}
