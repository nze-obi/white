import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function FloatingIpsPage() {
  return (
    <ResourceBrowser
      title="Floating IPs"
      description="Allocate and manage public IP addresses and their associations with private cloud resources."
      path="/api/v3/network/floating-ip/list"
      createOperationId="9040a8bd_controller_create_floating_ip_api"
      columns={[
        "floating_ip_address",
        "status",
        "fixed_ip_address",
        "port_id",
        "floating_network_id",
        "description",
        "id",
      ]}
    />
  );
}

