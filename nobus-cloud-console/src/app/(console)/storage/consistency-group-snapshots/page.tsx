import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function ConsistencyGroupSnapshotsPage() {
  return (
    <ResourceBrowser
      title="Consistency Group Snapshots"
      description="Create and manage point-in-time snapshots of consistency groups."
      path="/api/v3/volume/consistency_group/snapshot/list"
      createOperationId="1cd00feb_controller_create_consistency_group_snapshot_api"
      columns={[
        "name",
        "status",
        "consistencygroup_id",
        "created_at",
        "id",
      ]}
    />
  );
}