import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function InstancesPage() {
  return (
    <ResourceBrowser
      title="Instances"
      description="Create and manage virtual machines, networking, storage, security groups, and compute actions."
      path="/api/v3/instance/list"
      createOperationId="6bc0659b_controller_create_instance_api"
      columns={[
        "name",
        "status",
        "addresses",
        "flavor",
        "image",
        "key_name",
        "created",
        "id",
      ]}
    />
  );
}