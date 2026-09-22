"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  Activity,
  Box,
  Boxes,
  Cloud,
  Database,
  FolderKanban,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Network,
  Server,
  Settings2,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

import {
  useBrand,
} from "@/components/brand-context";

import {
  cn,
} from "@/lib/utils";

const items = [
  [
    "/dashboard",
    "Overview",
    LayoutDashboard,
  ],
  [
    "/compute/instances",
    "Instances",
    Server,
  ],
  [
    "/compute/images",
    "Images",
    Box,
  ],
  [
    "/compute/flavors",
    "Flavors",
    Boxes,
  ],
  [
    "/compute/keypairs",
    "Keypairs",
    KeyRound,
  ],
  [
    "/networking/networks",
    "Networks",
    Network,
  ],
  [
    "/networking/subnets",
    "Subnets",
    Network,
  ],
  [
    "/networking/routers",
    "Routers",
    Network,
  ],
  [
    "/networking/security-groups",
    "Security Groups",
    ShieldCheck,
  ],
  [
    "/networking/floating-ips",
    "Floating IPs",
    Activity,
  ],
  [
    "/networking/firewalls",
    "Firewalls",
    ShieldCheck,
  ],
  [
    "/storage/volumes",
    "Volumes",
    HardDrive,
  ],
  [
    "/storage/snapshots",
    "Snapshots",
    HardDrive,
  ],
  [
    "/storage/backups",
    "Backups",
    HardDrive,
  ],
  [
    "/storage/object",
    "Object Storage",
    Database,
  ],
  [
    "/projects",
    "Projects",
    FolderKanban,
  ],
  [
    "/credentials",
    "App Credentials",
    KeyRound,
  ],
  [
    "/workbench",
    "API Workbench",
    TerminalSquare,
  ],
  [
    "/settings",
    "Settings",
    Settings2,
  ],
] as const;

export function Sidebar() {
  const pathname =
    usePathname();

  const brand =
    useBrand();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] border-r border-slate-200 bg-slate-950 text-white lg:block">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        {brand.logoUrl ? (
          /*
           * Brand logos can come from a runtime-configured URL.
           * A native image avoids requiring every possible customer
           * logo hostname in next.config.ts.
           */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              brand.logoUrl
            }
            alt=""
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{
              background:
                "var(--brand-primary)",
            }}
          >
            <Cloud className="h-5 w-5" />
          </div>
        )}

        <div>
          <div className="font-semibold">
            {brand.name}
          </div>

          <div className="text-[11px] text-slate-400">
            Cloud Console
          </div>
        </div>
      </div>

      <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3">
        {items.map(
          ([
            href,
            label,
            Icon,
          ]) => {
            const active =
              pathname === href ||
              pathname.startsWith(
                `${href}/`,
              );

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-white/10 font-semibold text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          },
        )}
      </nav>
    </aside>
  );
}
