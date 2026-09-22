import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function QosPoliciesPage() {
  return (
    <ResourceBrowser
      title="QoS Policies"
      description="Create and manage network Quality of Service policies for traffic control and prioritization."
      path="/api/v3/network/qos-policy/list"
      createOperationId="f027212e_controller_create_qos_policy_api"
      columns={[
        "name",
        "description",
        "shared",
        "tags",
        "id",
      ]}
    />
  );
}