import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function ConsistencyGroupsPage() {
  return (
    <ResourceBrowser
      title="Consistency Groups"
      description="Create and manage groups of volumes that should be handled consistently for coordinated storage operations."
      path="/api/v3/volume/consistency_group/list"
      createOperationId="edd1f89b_controller_create_consistency_group_api"
      columns={[
        "name",
        "status",
        "availability_zone",
        "volume_types",
        "volumes",
        "created_at",
        "id",
      ]}
    />
  );
}