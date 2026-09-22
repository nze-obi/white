import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function ProjectsPage() {
  return (
    <ResourceBrowser
      title="Projects"
      description="Create and manage cloud projects, quotas, bandwidth limits, and availability-zone assignments."
      path="/api/v3/project/"
      createOperationId="c023cc70_controller_create_project_api"
      columns={[
        "name",
        "availability_zone",
        "is_default",
        "swift_quota",
        "current_swift_quota",
        "bandwidth",
        "current_bandwidth",
        "date_created",
        "id",
      ]}
    />
  );
}