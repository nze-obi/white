import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function SubnetsPage() {
  return (
    <ResourceBrowser
      title="Subnets"
      description="Create and manage IP subnets, gateways, DHCP settings, DNS servers, and allocation ranges."
      path="/api/v3/network/subnet/list"
      createOperationId="7b834ebe_controller_create_subnet_api"
      columns={[
        "name",
        "cidr",
        "ip_version",
        "gateway_ip",
        "enable_dhcp",
        "network_id",
        "dns_nameservers",
        "id",
      ]}
    />
  );
}