import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function ObjectStoragePage() {
  return (
    <ResourceBrowser
      title="Object Storage"
      description="Create and manage object-storage containers for files, media, backups, and application data."
      path="/api/v3/fos/container"
      createOperationId="959b4b29_controller_create_container_api"
      columns={[
        "name",
        "count",
        "bytes",
        "last_modified",
      ]}
    />
  );
}