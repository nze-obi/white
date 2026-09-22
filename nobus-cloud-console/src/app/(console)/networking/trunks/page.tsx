import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function TrunksPage() {
  return (
    <ResourceBrowser
      title="Trunks"
      description="Create and manage network trunks that connect a parent port to VLAN-tagged subports."
      path="/api/v3/network/trunk/list"
      createOperationId="2e05e17a_controller_create_trunk_api"
      columns={[
        "name",
        "status",
        "port_id",
        "sub_ports",
        "description",
        "id",
      ]}
    />
  );
}