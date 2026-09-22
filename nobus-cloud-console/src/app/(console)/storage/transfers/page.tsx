import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function VolumeTransfersPage() {
  return (
    <ResourceBrowser
      title="Volume Transfers"
      description="Create, review, accept, and manage block storage ownership transfers."
      path="/api/v3/volume/volume_transfer/list"
      createOperationId="0ce96602_controller_create_volume_transfer_api"
      columns={[
        "name",
        "volume_id",
        "created_at",
        "id",
      ]}
    />
  );
}