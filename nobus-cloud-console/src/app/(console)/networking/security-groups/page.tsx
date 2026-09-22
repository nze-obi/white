import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function SecurityGroupsPage() {
  return (
    <ResourceBrowser
      title="Security Groups"
      description="Create and manage security groups and open each group to configure its ingress and egress rules."
      path="/api/v3/network/security-group/list"
      createOperationId="0526c762_controller_create_security_group_api"
      columns={[
        "name",
        "description",
        "tags",
        "id",
      ]}
      detailPath="/networking/security-groups"
      detailIdField="id"
    />
  );
}