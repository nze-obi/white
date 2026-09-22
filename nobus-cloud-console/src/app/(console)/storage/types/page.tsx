import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function VolumeTypesPage() {
  return (
    <ResourceBrowser
      title="Volume Types"
      description="Manage block storage classes and their backend specifications."
      path="/api/v3/volume/volume_type/list"
      createOperationId="b21ad967_controller_create_volume_type_api"
      columns={[
        "name",
        "description",
        "is_public",
        "extra_specs",
        "id",
      ]}
    />
  );
}