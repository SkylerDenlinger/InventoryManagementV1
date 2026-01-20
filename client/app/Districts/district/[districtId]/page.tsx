import LocationClient from "@/app/districts/district/[districtId]/location/[locationId]/locationClient";

type PageProps = {
  params: { districtId: string; locationId: string };
};

export default function Page({ params }: PageProps) {
  const { districtId, locationId } = params; // extract primitives

  return (
    <LocationClient districtId={districtId} locationId={locationId} />
  );
}
