import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function FirewallGroupsPage() {
  return (
    <ResourceBrowser
      title="Firewall Groups"
      description="Create and manage firewall groups that apply ingress and egress network security policies to ports."
      path="/api/v3/network/firewall-group/list"
      createOperationId="8ee52f41_controller_create_firewall_group_api"
      columns={[
        "name",
        "admin_state_up",
        "ingress_firewall_policy_id",
        "egress_firewall_policy_id",
        "ports",
        "description",
        "id",
      ]}
    />
  );
}