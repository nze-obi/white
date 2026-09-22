import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function RoutersPage() {
  return (
    <ResourceBrowser
      title="Routers"
      description="Create and manage virtual routers, external gateways, and network interfaces."
      path="/api/v3/network/router/list"
      createOperationId="aadc08d7_controller_create_router_api"
      columns={[
        "name",
        "status",
        "admin_state_up",
        "external_gateway_info",
        "routes",
        "description",
        "id",
      ]}
    />
  );
}