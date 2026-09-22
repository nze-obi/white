import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function BackupsPage() {
  return (
    <ResourceBrowser
      title="Backups"
      description="Create, restore, and manage backups of your block storage volumes."
      path="/api/v3/volume/backup/list"
      createOperationId="8b855b2a_controller_create_backup_api"
      columns={[
        "name",
        "status",
        "volume_id",
        "size",
        "container",
        "created_at",
        "id",
      ]}
    />
  );
}