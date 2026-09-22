import { ResourceBrowser } from "@/components/resource-browser";

export default function KeypairsPage() {
  return (
    <ResourceBrowser
      title="Keypairs"
      description="Manage SSH keypairs used to securely access your virtual machines."
      path="/api/v3/keypair/"
      createOperationId="8ef1f0e7_controller_create_keypair_api"
      columns={[
        "name",
      ]}
    />
  );
}