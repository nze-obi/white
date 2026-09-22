import { ResourceBrowser } from "@/components/resource-browser";

export default function CredentialsPage() {
  return (
    <ResourceBrowser
      title="Application Credentials"
      description="Create and manage application credentials for API and automation access."
      path="/api/v3/app-credentials"
      createOperationId="86714d71_controller_create_app_credential_api"
      columns={[
        "name",
        "description",
        "expires_at",
        "unrestricted",
        "id",
      ]}
    />
  );
}