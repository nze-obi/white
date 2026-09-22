import { ResourceBrowser } from "@/components/resource-browser";

export default function VolumesPage() {
  return (
    <ResourceBrowser
      title="Volumes"
      description="Create and manage block storage volumes."
      path="/api/v3/volume/list"
      createOperationId="4adbf523_controller_create_volume_api"
      columns={[
        "id",
        "name",
        "status",
        "size",
        "availability_zone",
        "volume_type",
      ]}
    />
  );
}