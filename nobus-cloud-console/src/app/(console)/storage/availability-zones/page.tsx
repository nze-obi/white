import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function AvailabilityZonesPage() {
  return (
    <ResourceBrowser
      title="Storage Availability Zones"
      description="View the availability zones exposed by the block storage service."
      path="/api/v3/volume/availability_zone/list"
      columns={[
        "name",
        "zoneState",
        "hosts",
      ]}
    />
  );
}