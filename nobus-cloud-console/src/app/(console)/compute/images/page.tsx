import {
  ResourceBrowser,
} from "@/components/resource-browser";

export default function ImagesPage() {
  return (
    <ResourceBrowser
      title="Images"
      description="Browse the machine images available for launching virtual machines."
      path="/api/v3/image/"
      columns={[
        "name",
        "id",
      ]}
    />
  );
}