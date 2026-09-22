import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function FlavorsPage() {
  return (
    <ResourceBrowser
      title="Flavors"
      description="Browse the compute sizes available for virtual machines."
      path="/api/v3/flavor/"
      columns={[
        "name",
        "vcpus",
        "ram",
        "disk",
        "ephemeral",
        "id",
      ]}
    />
  );
}