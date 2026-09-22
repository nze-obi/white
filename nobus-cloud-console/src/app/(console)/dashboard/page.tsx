"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";

import {
  ArrowUpRight,
  FolderKanban,
  HardDrive,
  Network,
  Server,
} from "lucide-react";

import {
  apiRequest,
  qs,
} from "@/lib/api-client";

import {
  findArray,
} from "@/lib/utils";

import {
  useCloudContext,
} from "@/components/cloud-context";

import {
  Card,
  PageHeader,
} from "@/components/ui";

export default function Dashboard() {
  const cloud = useCloudContext();

  const common = {
    project_id: cloud.projectId,
    availability_zone:
      cloud.availabilityZone,
  };

  const resources = [
    {
      label: "Instances",
      icon: Server,
      path: "/api/v3/instance/list",
      href: "/compute/instances",
    },
    {
      label: "Volumes",
      icon: HardDrive,
      path: "/api/v3/volume/list",
      href: "/storage/volumes",
    },
    {
      label: "Networks",
      icon: Network,
      path: "/api/v3/network/list",
      href: "/networking/networks",
    },
  ] as const;

  const queries = useQueries({
    queries: resources.map(
      (resource) => ({
        queryKey: [
          resource.path,
          common,
        ],

        enabled: Boolean(
          cloud.projectId,
        ),

        queryFn: () =>
          apiRequest(
            `${resource.path}${qs(
              common,
            )}`,
          ),
      }),
    ),
  });

  return (
    <>
      <PageHeader
        title="Cloud overview"
        description="Operational view of your current project and availability zone."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resources.map(
          (resource, index) => {
            const Icon =
              resource.icon;

            const query =
              queries[index];

            return (
              <Link
                href={resource.href}
                key={resource.label}
              >
                <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="mt-5 text-3xl font-bold">
                    {query.isLoading
                      ? "…"
                      : query.isError
                        ? "—"
                        : findArray(
                            query.data,
                          ).length}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {resource.label}
                  </div>
                </Card>
              </Link>
            );
          },
        )}

        <Link href="/projects">
          <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100">
                <FolderKanban className="h-5 w-5 text-slate-700" />
              </div>

              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-5 text-lg font-semibold">
              {cloud.projectId ||
                "Select project"}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Current project
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <h2 className="font-semibold">
            Quick actions
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/compute/instances"
            >
              <b>
                Create an instance
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Provision compute from
                an image and flavor.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/networking/networks"
            >
              <b>
                Create a network
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Build isolated cloud
                networking.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/networking/security-groups"
            >
              <b>
                Security groups
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Create security groups
                and manage their rules.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/storage/volumes"
            >
              <b>
                Create a volume
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage block
                storage.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/compute/keypairs"
            >
              <b>
                Keypairs
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage SSH
                keypairs.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/credentials"
            >
              <b>
                Application credentials
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Manage programmatic
                access credentials.
              </p>
            </Link>

            <Link
              className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
              href="/workbench"
            >
              <b>
                API Workbench
              </b>

              <p className="mt-1 text-sm text-slate-500">
                Access every operation
                in the Nobus v3 API.
              </p>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">
            Context
          </h2>

          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">
                Project ID
              </dt>

              <dd className="mt-1 break-all font-medium">
                {cloud.projectId ||
                  "Not selected"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">
                Availability zone
              </dt>

              <dd className="mt-1 font-medium">
                {
                  cloud.availabilityZone
                }
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}