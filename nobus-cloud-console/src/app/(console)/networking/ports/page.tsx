import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function PortsPage() {
  return (
    <ResourceBrowser
      title="Ports"
      description="Create and manage virtual network ports, fixed IPs, security groups, and interface bindings."
      path="/api/v3/network/port/list"
      createOperationId="fac2f2df_controller_create_port_api"
      columns={[
        "name",
        "status",
        "network_id",
        "fixed_ips",
        "mac_address",
        "device_owner",
        "port_security_enabled",
        "id",
      ]}
    />
  );
}