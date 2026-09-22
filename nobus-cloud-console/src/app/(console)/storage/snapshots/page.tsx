import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function SnapshotsPage() {
  return (
    <ResourceBrowser
      title="Snapshots"
      description="Create and manage point-in-time snapshots of your block storage volumes."
      path="/api/v3/volume/snapshot/list"
      createOperationId="98942423_controller_create_snapshot_api"
      columns={[
        "name",
        "status",
        "volume_id",
        "size",
        "created_at",
        "id",
      ]}
    />
  );
}