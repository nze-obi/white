import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function NetworksPage() {
  return (
    <ResourceBrowser
      title="Networks"
      description="Create and manage virtual networks, subnets, routing, and network security settings."
      path="/api/v3/network/list"
      createOperationId="25e51297_controller_create_network_api"
      columns={[
        "name",
        "status",
        "admin_state_up",
        "shared",
        "router_external",
        "mtu",
        "port_security_enabled",
        "subnets",
        "id",
      ]}
    />
  );
}