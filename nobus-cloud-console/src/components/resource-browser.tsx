"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  apiRequest,
  qs,
} from "@/lib/api-client";

import {
  Operation,
  operations,
} from "@/lib/openapi";

import {
  findArray,
  safeString,
  titleCase,
} from "@/lib/utils";

import {
  useCloudContext,
} from "@/components/cloud-context";

import {
  OperationRunner,
} from "@/components/operation-runner";

import {
  Button,
  Card,
  Input,
  PageHeader,
} from "@/components/ui";

type Props = {
  title: string;
  description: string;
  path: string;
  needsProject?: boolean;
  extraParams?: Record<
    string,
    unknown
  >;
  createOperationId?: string;
  columns?: string[];
  detailPath?: string;
  detailIdField?: string;
};

type SelectedAction = {
  operation: Operation;
  row?: Record<
    string,
    unknown
  >;
};

type ActionGroup = {
  name: string;
  operations: Operation[];
};

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value,
    )
  );
}

function rawString(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    const text =
      value.trim();

    if (
      !text ||
      text === "—"
    ) {
      return "";
    }

    return text;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

function referenceNameMap(
  payload: unknown,
): Map<string, string> {
  const result =
    new Map<
      string,
      string
    >();

  for (
    const item of
      findArray(payload)
  ) {
    const id =
      rawString(
        item.id,
      ) ||
      rawString(
        item.uuid,
      );

    const name =
      rawString(
        item.name,
      ) ||
      rawString(
        item.original_name,
      ) ||
      rawString(
        item.display_name,
      );

    if (
      id &&
      name
    ) {
      result.set(
        id,
        name,
      );
    }
  }

  return result;
}

function instanceAddresses(
  value: unknown,
): {
  ipv4: string;
  ipv6: string;
} {
  let ipv4 = "";
  let ipv6 = "";

  if (
    !isRecord(value)
  ) {
    return {
      ipv4,
      ipv6,
    };
  }

  for (
    const networkValue of
      Object.values(value)
  ) {
    const entries =
      Array.isArray(
        networkValue,
      )
        ? networkValue
        : [networkValue];

    for (
      const entry of entries
    ) {
      if (
        !isRecord(entry)
      ) {
        continue;
      }

      const address =
        rawString(
          entry.addr,
        ) ||
        rawString(
          entry.address,
        ) ||
        rawString(
          entry.ip_address,
        ) ||
        rawString(
          entry.fixed_ip_address,
        );

      if (!address) {
        continue;
      }

      const version =
        rawString(
          entry.version,
        );

      if (
        !ipv4 &&
        (
          version === "4" ||
          address.includes(".")
        )
      ) {
        ipv4 = address;
      }

      if (
        !ipv6 &&
        (
          version === "6" ||
          address.includes(":")
        )
      ) {
        ipv6 = address;
      }
    }
  }

  return {
    ipv4,
    ipv6,
  };
}

function normalizeInstanceDisplay(
  row: Record<
    string,
    unknown
  >,
  imageNames: Map<
    string,
    string
  >,
  flavorNames: Map<
    string,
    string
  >,
): Record<
  string,
  unknown
> {
  const image =
    isRecord(
      row.image,
    )
      ? row.image
      : {};

  const flavor =
    isRecord(
      row.flavor,
    )
      ? row.flavor
      : {};

  const imageId =
    rawString(
      row.image_id,
    ) ||
    rawString(
      image.id,
    );

  const flavorId =
    rawString(
      row.flavor_id,
    ) ||
    rawString(
      flavor.id,
    );

  const imageName =
    rawString(
      row.image_name,
    ) ||
    rawString(
      image.name,
    ) ||
    rawString(
      image.original_name,
    ) ||
    (
      imageId
        ? imageNames.get(
            imageId,
          ) || ""
        : ""
    );

  const flavorName =
    rawString(
      row.flavor_name,
    ) ||
    rawString(
      flavor.name,
    ) ||
    rawString(
      flavor.original_name,
    ) ||
    (
      flavorId
        ? flavorNames.get(
            flavorId,
          ) || ""
        : ""
    );

  const discoveredIps =
    instanceAddresses(
      row.addresses,
    );

  const ipv4 =
    rawString(
      row.ipv4,
    ) ||
    discoveredIps.ipv4;

  const ipv6 =
    rawString(
      row.ipv6,
    ) ||
    discoveredIps.ipv6;

  return {
    ...row,

    /*
     * Keep the backend IDs available for actions/search,
     * but expose only friendly names in the visible
     * Image and Flavor columns.
     */
    image_id:
      imageId ||
      null,

    flavor_id:
      flavorId ||
      null,

    image_name:
      imageName ||
      null,

    flavor_name:
      flavorName ||
      null,

    /*
     * The table should show the address itself rather
     * than OpenStack's nested addresses object.
     */
    ipv4:
      ipv4 ||
      null,

    ipv6:
      ipv6 ||
      null,

    ip_address:
      ipv4 ||
      ipv6 ||
      null,
  };
}

function columnLabel(
  path: string,
  key: string,
) {
  if (
    path ===
    "/api/v3/instance/list"
  ) {
    if (
      key === "image" ||
      key === "image_name"
    ) {
      return "Image";
    }

    if (
      key === "flavor" ||
      key === "flavor_name"
    ) {
      return "Flavor";
    }

    if (
      key === "addresses" ||
      key === "ipv4" ||
      key === "ip_address"
    ) {
      return "IP Address";
    }

    if (
      key === "ipv6"
    ) {
      return "IPv6 Address";
    }
  }

  return titleCase(
    key,
  );
}

/*
 * Normalize differences between the generated
 * OpenAPI model and the live API response.
 */
function normalizeRow(
  path: string,
  row: Record<
    string,
    unknown
  >,
): Record<
  string,
  unknown
> {
  /*
   * KEYPAIRS
   *
   * OpenAPI documents:
   *
   * {
   *   id,
   *   name,
   *   public_key,
   *   fingerprint,
   *   user_id,
   *   type
   * }
   *
   * The live API is currently returning rows
   * where the keypair's actual name is stored
   * in `id`.
   *
   * Example:
   *
   * { id: "zabbix" }
   *
   * It may also return OpenStack-style nested
   * objects, so support those too.
   */
  /*
   * SECURITY GROUPS
   *
   * The OpenAPI response uses `id`, but the
   * live API may expose the identifier as
   * `security_group_id`, `securitygroup_id`,
   * or inside a nested security_group/data/_info
   * object. Normalize all of those to `id` so
   * the table and row actions behave consistently.
   */
  if (
    path ===
    "/api/v3/network/security-group/list"
  ) {
    const securityGroup =
      isRecord(
        row.security_group,
      )
        ? row.security_group
        : {};

    const info =
      isRecord(
        row._info,
      )
        ? row._info
        : {};

    const data =
      isRecord(
        row.data,
      )
        ? row.data
        : {};

    const id =
      rawString(
        row.id,
      ) ||
      rawString(
        row.security_group_id,
      ) ||
      rawString(
        row.securitygroup_id,
      ) ||
      rawString(
        securityGroup.id,
      ) ||
      rawString(
        securityGroup.security_group_id,
      ) ||
      rawString(
        securityGroup.securitygroup_id,
      ) ||
      rawString(
        info.id,
      ) ||
      rawString(
        info.security_group_id,
      ) ||
      rawString(
        info.securitygroup_id,
      ) ||
      rawString(
        data.id,
      ) ||
      rawString(
        data.security_group_id,
      ) ||
      rawString(
        data.securitygroup_id,
      ) ||
      rawString(
        row.uuid,
      ) ||
      rawString(
        securityGroup.uuid,
      );

    const name =
      rawString(
        row.name,
      ) ||
      rawString(
        securityGroup.name,
      ) ||
      rawString(
        info.name,
      ) ||
      rawString(
        data.name,
      );

    const description =
      rawString(
        row.description,
      ) ||
      rawString(
        securityGroup.description,
      ) ||
      rawString(
        info.description,
      ) ||
      rawString(
        data.description,
      );

    const tags =
      row.tags ??
      securityGroup.tags ??
      info.tags ??
      data.tags ??
      null;

    return {
      ...row,
      ...data,
      ...info,
      ...securityGroup,

      id:
        id ||
        null,

      security_group_id:
        id ||
        null,

      securitygroup_id:
        id ||
        null,

      name:
        name ||
        null,

      description:
        description ||
        null,

      tags,
    };
  }

  if (
    path ===
    "/api/v3/keypair/"
  ) {
    const keypair =
      isRecord(
        row.keypair,
      )
        ? row.keypair
        : {};

    const info =
      isRecord(
        row._info,
      )
        ? row._info
        : {};

    const data =
      isRecord(
        row.data,
      )
        ? row.data
        : {};

    const backendId =
      rawString(
        row.id,
      ) ||
      rawString(
        keypair.id,
      ) ||
      rawString(
        info.id,
      ) ||
      rawString(
        data.id,
      ) ||
      rawString(
        row.uuid,
      ) ||
      rawString(
        keypair.uuid,
      );

    const name =
      rawString(
        row.name,
      ) ||
      rawString(
        row.keypair_name,
      ) ||
      rawString(
        keypair.name,
      ) ||
      rawString(
        keypair.keypair_name,
      ) ||
      rawString(
        info.name,
      ) ||
      rawString(
        info.keypair_name,
      ) ||
      rawString(
        data.name,
      ) ||
      rawString(
        data.keypair_name,
      ) ||
      backendId;

    const fingerprint =
      rawString(
        row.fingerprint,
      ) ||
      rawString(
        keypair.fingerprint,
      ) ||
      rawString(
        info.fingerprint,
      ) ||
      rawString(
        data.fingerprint,
      );

    const publicKey =
      rawString(
        row.public_key,
      ) ||
      rawString(
        keypair.public_key,
      ) ||
      rawString(
        info.public_key,
      ) ||
      rawString(
        data.public_key,
      ) ||
      rawString(
        row.publicKey,
      ) ||
      rawString(
        keypair.publicKey,
      );

    const type =
      rawString(
        row.type,
      ) ||
      rawString(
        keypair.type,
      ) ||
      rawString(
        info.type,
      ) ||
      rawString(
        data.type,
      );

    const userId =
      rawString(
        row.user_id,
      ) ||
      rawString(
        keypair.user_id,
      ) ||
      rawString(
        info.user_id,
      ) ||
      rawString(
        data.user_id,
      ) ||
      rawString(
        row.userId,
      );

    return {
      ...row,
      ...data,
      ...info,
      ...keypair,

      id:
        backendId ||
        name,

      name,

      fingerprint:
        fingerprint ||
        null,

      public_key:
        publicKey ||
        null,

      type:
        type ||
        null,

      user_id:
        userId ||
        null,
    };
  }

  return row;
}

function relatedOperations(
  listPath: string,
): Operation[] {
  if (
    listPath ===
    "/api/v3/instance/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/instance" ||
        operation.path.startsWith(
          "/api/v3/instance/",
        ),
    );
  }

  if (
    listPath ===
    "/api/v3/network/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/" ||
        operation.path ===
          "/api/v3/network/only" ||
        operation.path ===
          "/api/v3/network/list",
    );
  }

  if (
    listPath ===
    "/api/v3/network/subnet/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/subnet" ||
        operation.path ===
          "/api/v3/network/subnet/list",
    );
  }

  if (
    listPath ===
    "/api/v3/network/port/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/port" ||
        operation.path ===
          "/api/v3/network/port/list" ||
        operation.path ===
          "/api/v3/network/port/clear-address-pairs" ||
        operation.path ===
          "/api/v3/network/port/address-pairs",
    );
  }

  if (
    listPath ===
    "/api/v3/network/router/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/router" ||
        operation.path ===
          "/api/v3/network/router/list" ||
        operation.path.startsWith(
          "/api/v3/network/router/",
        ),
    );
  }

  if (
    listPath ===
    "/api/v3/network/floating-ip/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/floating-ip" ||
        operation.path ===
          "/api/v3/network/floating-ip/list" ||
        operation.path ===
          "/api/v3/network/floating-ip/disassociate",
    );
  }

  if (
    listPath ===
    "/api/v3/network/security-group/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/security-group" ||
        operation.path ===
          "/api/v3/network/security-group/list",
    );
  }

  if (
    listPath ===
    "/api/v3/network/trunk/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/trunk" ||
        operation.path ===
          "/api/v3/network/trunk/list",
    );
  }

  if (
    listPath ===
    "/api/v3/network/qos-policy/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/qos-policy" ||
        operation.path ===
          "/api/v3/network/qos-policy/list",
    );
  }

  if (
    listPath ===
    "/api/v3/network/firewall-group/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/network/firewall-group" ||
        operation.path ===
          "/api/v3/network/firewall-group/list",
    );
  }

  if (
    listPath ===
    "/api/v3/keypair/"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
        "/api/v3/keypair/",
    );
  }

  if (
    listPath ===
    "/api/v3/project/"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/project/" ||
        operation.path ===
          "/api/v3/project/create",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/" ||
        operation.path ===
          "/api/v3/volume/list" ||
        operation.path ===
          "/api/v3/volume/attach" ||
        operation.path ===
          "/api/v3/volume/detach" ||
        operation.path ===
          "/api/v3/volume/extend",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/snapshot/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/snapshot" ||
        operation.path ===
          "/api/v3/volume/snapshot/list",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/backup/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/backup" ||
        operation.path ===
          "/api/v3/volume/backup/list" ||
        operation.path ===
          "/api/v3/volume/backup/restore",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/volume_type/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/volume_type" ||
        operation.path ===
          "/api/v3/volume/volume_type/list",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/volume_transfer/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/volume_transfer" ||
        operation.path ===
          "/api/v3/volume/volume_transfer/list" ||
        operation.path ===
          "/api/v3/volume/volume_transfer/accept",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/consistency_group/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/consistency_group" ||
        operation.path ===
          "/api/v3/volume/consistency_group/list",
    );
  }

  if (
    listPath ===
    "/api/v3/volume/consistency_group/snapshot/list"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/volume/consistency_group/snapshot" ||
        operation.path ===
          "/api/v3/volume/consistency_group/snapshot/list",
    );
  }

  if (
    listPath ===
    "/api/v3/fos/container"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/fos/container" ||
        operation.path ===
          "/api/v3/fos/container/upload" ||
        operation.path ===
          "/api/v3/fos/container/objects" ||
        operation.path ===
          "/api/v3/fos/container/object" ||
        operation.path ===
          "/api/v3/fos/container/object/download",
    );
  }

  if (
    listPath ===
    "/api/v3/app-credentials"
  ) {
    return operations.filter(
      (operation) =>
        operation.path ===
          "/api/v3/app-credentials" ||
        operation.path ===
          "/api/v3/app-credentials/{application_credential_id}" ||
        operation.path ===
          "/api/v3/app-credentials/by-name/{name}",
    );
  }

  return [];
}

function operationFieldNames(
  operation: Operation,
) {
  return [
    ...operation.parameters.map(
      (parameter) =>
        parameter.name,
    ),

    ...(
      operation.requestSchema
        ?.properties
        ? Object.keys(
            operation.requestSchema
              .properties,
          )
        : []
    ),
  ];
}

function operationNeedsResource(
  operation: Operation,
) {
  const names =
    operationFieldNames(
      operation,
    );

  const knownResourceFields =
    new Set([
      "server_id",
      "instance_id",

      "network_id",
      "subnet_id",
      "port_id",
      "router_id",

      "floating_ip_id",
      "floatingip_id",

      "security_group_id",
      "securitygroup_id",
      "security_group_rule_id",

      "trunk_id",

      "firewall_group_id",
      "qos_policy_id",

      "volume_id",
      "snapshot_id",
      "backup_id",

      "volume_type_id",

      "transfer_id",
      "volume_transfer_id",

      "consistency_group_id",
      "consistencygroup_id",

      "consistency_group_snapshot_id",

      "application_credential_id",
      "app_credential_id",

      "keypair_id",
    ]);

  return names.some(
    (name) =>
      knownResourceFields.has(
        name,
      ),
  );
}

function resourceValues(
  row: Record<
    string,
    unknown
  >,
) {
  const id =
    rawString(
      row.id,
    ) ||
    rawString(
      row.uuid,
    ) ||
    rawString(
      row.name,
    );

  const name =
    rawString(
      row.name,
    ) ||
    rawString(
      row.keypair_name,
    ) ||
    id;

  return {
    id,

    server_id:
      id,

    instance_id:
      id,

    network_id:
      id,

    subnet_id:
      id,

    port_id:
      id,

    router_id:
      id,

    floating_ip_id:
      id,

    floatingip_id:
      id,

    security_group_id:
      id,

    securitygroup_id:
      id,

    security_group_rule_id:
      id,

    trunk_id:
      id,

    firewall_group_id:
      id,

    qos_policy_id:
      id,

    volume_id:
      id,

    snapshot_id:
      id,

    backup_id:
      id,

    volume_type_id:
      id,

    transfer_id:
      id,

    volume_transfer_id:
      id,

    consistency_group_id:
      id,

    consistencygroup_id:
      id,

    consistency_group_snapshot_id:
      id,

    application_credential_id:
      id,

    app_credential_id:
      id,

    /*
     * Live Keypair list currently puts the
     * keypair name in `id`.
     */
    keypair_id:
      name,

    container_name:
      name,
  };
}

function cleanOperationLabel(
  operation: Operation,
) {
  return operation.summary
    .replace(
      / Api$/i,
      "",
    )
    .replace(
      /^Get Server /i,
      "",
    )
    .replace(
      /^Get /i,
      "View ",
    )
    .replace(
      /^New List /i,
      "View ",
    )
    .replace(
      /^List /i,
      "View ",
    )
    .replace(
      / Instance$/i,
      "",
    );
}

function isDestructive(
  operation: Operation,
) {
  return (
    operation.method ===
      "delete" ||
    /delete|remove|clear|detach|revoke|shutdown|revert/i.test(
      operation.summary,
    )
  );
}

function statusClasses(
  value: string,
) {
  const status =
    value.toLowerCase();

  if (
    [
      "active",
      "available",
      "running",
      "ready",
      "enabled",
      "success",
      "completed",
      "online",
      "up",
      "public",
    ].includes(status)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "error",
      "failed",
      "failure",
      "down",
    ].includes(status)
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    [
      "shutoff",
      "stopped",
      "disabled",
      "offline",
      "private",
    ].includes(status)
  ) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (
    [
      "building",
      "creating",
      "attaching",
      "detaching",
      "deleting",
      "resizing",
      "rebooting",
      "pending",
      "processing",
      "in-progress",
    ].includes(status)
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    [
      "paused",
      "suspended",
      "warning",
      "locked",
    ].includes(status)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    [
      "in-use",
      "in_use",
    ].includes(status)
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({
  value,
}: {
  value: unknown;
}) {
  const text =
    rawString(
      value,
    );

  if (!text) {
    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
        text,
      )}`}
    >
      {text}
    </span>
  );
}

function groupInstanceOperations(
  rowOperations: Operation[],
): ActionGroup[] {
  const groups: ActionGroup[] =
    [
      {
        name: "Power",
        operations: [],
      },

      {
        name: "Compute",
        operations: [],
      },

      {
        name: "Networking",
        operations: [],
      },

      {
        name: "Security",
        operations: [],
      },

      {
        name:
          "Console & Diagnostics",
        operations: [],
      },

      {
        name:
          "Configuration",
        operations: [],
      },

      {
        name:
          "Danger zone",
        operations: [],
      },
    ];

  for (
    const operation of
      rowOperations
  ) {
    const text =
      `${operation.summary} ${operation.path}`.toLowerCase();

    if (
      isDestructive(
        operation,
      ) &&
      /delete server|delete instance/i.test(
        operation.summary,
      )
    ) {
      groups[6].operations.push(
        operation,
      );

      continue;
    }

    if (
      /shutdown|reboot|start|stop|suspend|resume|lock|unlock|pause|unpause|confirm-resize|revert-resize/.test(
        text,
      )
    ) {
      groups[0].operations.push(
        operation,
      );

      continue;
    }

    if (
      /resize|flavor|create-server-image/.test(
        text,
      )
    ) {
      groups[1].operations.push(
        operation,
      );

      continue;
    }

    if (
      /network-interface|network|floating|port/.test(
        text,
      )
    ) {
      groups[2].operations.push(
        operation,
      );

      continue;
    }

    if (
      /security-group|password/.test(
        text,
      )
    ) {
      groups[3].operations.push(
        operation,
      );

      continue;
    }

    if (
      /console|diagnostic|topology/.test(
        text,
      )
    ) {
      groups[4].operations.push(
        operation,
      );

      continue;
    }

    if (
      isDestructive(
        operation,
      )
    ) {
      groups[6].operations.push(
        operation,
      );

      continue;
    }

    groups[5].operations.push(
      operation,
    );
  }

  return groups.filter(
    (group) =>
      group.operations.length >
      0,
  );
}

function defaultGroups(
  rowOperations: Operation[],
): ActionGroup[] {
  const normal =
    rowOperations.filter(
      (operation) =>
        !isDestructive(
          operation,
        ),
    );

  const dangerous =
    rowOperations.filter(
      (operation) =>
        isDestructive(
          operation,
        ),
    );

  const groups:
    ActionGroup[] = [];

  if (
    normal.length > 0
  ) {
    groups.push({
      name: "Actions",
      operations:
        normal,
    });
  }

  if (
    dangerous.length > 0
  ) {
    groups.push({
      name:
        "Danger zone",
      operations:
        dangerous,
    });
  }

  return groups;
}

function SkeletonTable({
  columns,
}: {
  columns: number;
}) {
  return (
    <div className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="h-3 w-52 animate-pulse rounded bg-slate-200" />
      </div>

      {Array.from({
        length: 5,
      }).map(
        (
          _,
          rowIndex,
        ) => (
          <div
            key={
              rowIndex
            }
            className="flex gap-8 border-b border-slate-100 px-5 py-5"
          >
            {Array.from({
              length:
                Math.max(
                  columns,
                  4,
                ),
            }).map(
              (
                __,
                columnIndex,
              ) => (
                <div
                  key={
                    columnIndex
                  }
                  className="h-4 flex-1 animate-pulse rounded bg-slate-100"
                />
              ),
            )}
          </div>
        ),
      )}
    </div>
  );
}

function buildContextParams(
  path: string,
  projectId: string,
  availabilityZone: string,
) {
  if (
    path ===
    "/api/v3/app-credentials"
  ) {
    return {
      project_id:
        projectId,

      az_name:
        availabilityZone,
    };
  }

  return {
    project_id:
      projectId,

    availability_zone:
      availabilityZone,
  };
}

export function ResourceBrowser({
  title,
  description,
  path,
  needsProject = true,
  extraParams = {},
  createOperationId,
  columns,
  detailPath,
  detailIdField = "id",
}: Props) {
  const cloud =
    useCloudContext();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    menuRow,
    setMenuRow,
  ] = useState<
    number | null
  >(null);

  const [
    selectedAction,
    setSelectedAction,
  ] = useState<
    SelectedAction | null
  >(null);

  const contextParams =
    needsProject
      ? buildContextParams(
          path,
          cloud.projectId,
          cloud.availabilityZone,
        )
      : {};

  const params = {
    ...contextParams,
    ...extraParams,
  };

  const enabled =
    !needsProject ||
    Boolean(
      cloud.projectId &&
        cloud.availabilityZone,
    );

  const isInstanceList =
    path ===
    "/api/v3/instance/list";

  const instanceImagesQuery =
    useQuery({
      queryKey: [
        "instance-list-image-names",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        enabled &&
        isInstanceList,

      queryFn: () =>
        apiRequest(
          `/api/v3/image/${qs(
            {
              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,
            },
          )}`,
        ),
    });

  const instanceFlavorsQuery =
    useQuery({
      queryKey: [
        "instance-list-flavor-names",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        enabled &&
        isInstanceList,

      queryFn: () =>
        apiRequest(
          `/api/v3/flavor/${qs(
            {
              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,
            },
          )}`,
        ),
    });

  const instanceImageNames =
    useMemo(
      () =>
        referenceNameMap(
          instanceImagesQuery.data,
        ),
      [
        instanceImagesQuery.data,
      ],
    );

  const instanceFlavorNames =
    useMemo(
      () =>
        referenceNameMap(
          instanceFlavorsQuery.data,
        ),
      [
        instanceFlavorsQuery.data,
      ],
    );

  const query =
    useQuery({
      queryKey: [
        path,
        params,
      ],

      enabled,

      queryFn: () =>
        apiRequest(
          `${path}${qs(
            params,
          )}`,
        ),
    });

  const rows =
    useMemo(
      () =>
        findArray(
          query.data,
        ).map(
          (row) => {
            const normalized =
              normalizeRow(
                path,
                row,
              );

            if (
              path ===
              "/api/v3/instance/list"
            ) {
              return normalizeInstanceDisplay(
                normalized,
                instanceImageNames,
                instanceFlavorNames,
              );
            }

            return normalized;
          },
        ),
      [
        query.data,
        path,
        instanceImageNames,
        instanceFlavorNames,
      ],
    );

  const filtered =
    useMemo(
      () =>
        rows.filter(
          (row) =>
            !search ||
            JSON.stringify(
              row,
            )
              .toLowerCase()
              .includes(
                search.toLowerCase(),
              ),
        ),
      [
        rows,
        search,
      ],
    );

  const keys =
    useMemo(
      () =>
        columns ||
        Array.from(
          new Set(
            filtered.flatMap(
              (row) =>
                Object.keys(
                  row,
                ),
            ),
          ),
        ).slice(
          0,
          6,
        ),
      [
        columns,
        filtered,
      ],
    );

  const resourceOperations =
    useMemo(
      () =>
        relatedOperations(
          path,
        ),
      [path],
    );

  const createOperation =
    createOperationId
      ? resourceOperations.find(
          (operation) =>
            operation.id ===
            createOperationId,
        )
      : undefined;

  const rowOperations =
    useMemo(
      () =>
        resourceOperations.filter(
          (operation) => {
            if (
              operation.id ===
              createOperationId
            ) {
              return false;
            }

            if (
              operation.method ===
                "get" &&
              operation.path ===
                path
            ) {
              return false;
            }

            if (
              path ===
              "/api/v3/fos/container"
            ) {
              return (
                operation.path ===
                  "/api/v3/fos/container/upload" ||
                operation.path ===
                  "/api/v3/fos/container/objects" ||
                (
                  operation.path ===
                    "/api/v3/fos/container" &&
                  operation.method ===
                    "delete"
                )
              );
            }

            return operationNeedsResource(
              operation,
            );
          },
        ),
      [
        resourceOperations,
        createOperationId,
        path,
      ],
    );

  const actionGroups =
    useMemo(
      () =>
        path ===
        "/api/v3/instance/list"
          ? groupInstanceOperations(
              rowOperations,
            )
          : defaultGroups(
              rowOperations,
            ),
      [
        path,
        rowOperations,
      ],
    );

  function openCreate() {
    if (
      !createOperation
    ) {
      return;
    }

    setSelectedAction({
      operation:
        createOperation,
    });
  }

  function openRowAction(
    operation: Operation,
    row: Record<
      string,
      unknown
    >,
  ) {
    setMenuRow(
      null,
    );

    setSelectedAction({
      operation,
      row,
    });
  }

  function closeDrawer() {
    setSelectedAction(
      null,
    );
  }

  function getDetailHref(
    row: Record<
      string,
      unknown
    >,
  ) {
    if (!detailPath) {
      return null;
    }

    const id =
      row[
        detailIdField
      ];

    if (
      id ===
        undefined ||
      id ===
        null ||
      id === ""
    ) {
      return null;
    }

    return `${detailPath}/${encodeURIComponent(
      String(id),
    )}`;
  }

  function renderCell(
    key: string,
    row: Record<
      string,
      unknown
    >,
  ) {
    const value =
      row[key];

    if (
      path ===
        "/api/v3/instance/list" &&
      (
        key === "image" ||
        key === "image_name"
      )
    ) {
      return (
        <span>
          {rawString(
            row.image_name,
          ) || "—"}
        </span>
      );
    }

    if (
      path ===
        "/api/v3/instance/list" &&
      (
        key === "flavor" ||
        key === "flavor_name"
      )
    ) {
      return (
        <span>
          {rawString(
            row.flavor_name,
          ) || "—"}
        </span>
      );
    }

    if (
      path ===
        "/api/v3/instance/list" &&
      key === "addresses"
    ) {
      return (
        <span>
          {rawString(
            row.ip_address,
          ) || "—"}
        </span>
      );
    }

    if (
      key.toLowerCase() ===
      "status"
    ) {
      return (
        <StatusBadge
          value={value}
        />
      );
    }

    if (
      key.toLowerCase() ===
        "enabled" ||
      key.toLowerCase() ===
        "admin_state_up" ||
      key.toLowerCase() ===
        "is_public"
    ) {
      const enabledValue =
        value === true ||
        String(
          value,
        ) === "true";

      return (
        <StatusBadge
          value={
            enabledValue
              ? key ===
                  "is_public"
                ? "Public"
                : "Enabled"
              : key ===
                  "is_public"
                ? "Private"
                : "Disabled"
          }
        />
      );
    }

    if (
      key === "name"
    ) {
      const href =
        getDetailHref(
          row,
        );

      const name =
        rawString(
          value,
        ) ||
        rawString(
          row.keypair_name,
        ) ||
        rawString(
          row.id,
        ) ||
        "Unnamed";

      if (href) {
        return (
          <Link
            href={href}
            className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
          >
            {name}
          </Link>
        );
      }

      return (
        <div className="font-medium text-slate-900">
          {name}
        </div>
      );
    }

    if (
      key === "id"
    ) {
      return (
        <span
          className="font-mono text-xs text-slate-500"
          title={
            rawString(
              value,
            )
          }
        >
          {rawString(
            value,
          ) ||
            "—"}
        </span>
      );
    }

    const text =
      safeString(
        value,
      );

    return (
      <span>
        {text ||
          "—"}
      </span>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={
          description
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                query.refetch()
              }
            >
              <RefreshCw className="h-4 w-4" />

              Refresh
            </Button>

            {createOperation && (
              <Button
                onClick={
                  openCreate
                }
              >
                <Plus className="h-4 w-4" />

                Create
              </Button>
            )}
          </div>
        }
      />

      {needsProject &&
        !cloud.projectId && (
          <Card className="mb-5 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Select a Project
            ID to view{" "}
            {title.toLowerCase()}.
          </Card>
        )}

      <Card className="overflow-visible">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              className="pl-9"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
            />
          </div>

          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {
                filtered.length
              }
            </span>{" "}
            resource
            {filtered.length ===
            1
              ? ""
              : "s"}
          </div>
        </div>

        {query.isLoading ? (
          <SkeletonTable
            columns={
              keys.length
            }
          />
        ) : query.isError ? (
          <div className="p-8">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="font-semibold text-red-800">
                Could not load{" "}
                {title.toLowerCase()}
              </div>

              <div className="mt-1 text-sm text-red-700">
                {
                  (
                    query.error as Error
                  ).message
                }
              </div>

              <Button
                className="mt-4"
                variant="secondary"
                onClick={() =>
                  query.refetch()
                }
              >
                <RefreshCw className="h-4 w-4" />

                Try again
              </Button>
            </div>
          </div>
        ) : filtered.length ===
          0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-base font-semibold text-slate-900">
              No{" "}
              {title.toLowerCase()}{" "}
              found
            </div>

            <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "No resources match your search."
                : createOperation
                  ? `You do not have any ${title.toLowerCase()} yet. Create one to get started.`
                  : "There are currently no resources to display."}
            </div>

            {!search &&
              createOperation && (
                <Button
                  className="mt-6"
                  onClick={
                    openCreate
                  }
                >
                  <Plus className="h-4 w-4" />

                  Create
                </Button>
              )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {keys.map(
                    (key) => (
                      <th
                        className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        key={key}
                      >
                        {columnLabel(
                          path,
                          key,
                        )}
                      </th>
                    ),
                  )}

                  {rowOperations.length >
                    0 && (
                    <th className="w-20 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(
                  (
                    row,
                    index,
                  ) => (
                    <tr
                      className="transition-colors hover:bg-slate-50/70"
                      key={String(
                        row.id ??
                          row.uuid ??
                          row.name ??
                          index,
                      )}
                    >
                      {keys.map(
                        (key) => (
                          <td
                            className="max-w-[280px] px-5 py-4 text-slate-700"
                            key={key}
                          >
                            <div className="truncate">
                              {renderCell(
                                key,
                                row,
                              )}
                            </div>
                          </td>
                        ),
                      )}

                      {rowOperations.length >
                        0 && (
                        <td className="relative px-5 py-3 text-right">
                          <button
                            type="button"
                            aria-label="Resource actions"
                            onClick={() =>
                              setMenuRow(
                                menuRow ===
                                  index
                                  ? null
                                  : index,
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {menuRow ===
                            index && (
                            <>
                              <button
                                type="button"
                                aria-label="Close actions menu"
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={() =>
                                  setMenuRow(
                                    null,
                                  )
                                }
                              />

                              <div className="absolute right-5 top-12 z-40 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
                                <div className="border-b border-slate-100 px-4 py-3">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Resource
                                  </div>

                                  <div className="mt-1 truncate font-medium text-slate-900">
                                    {rawString(
                                      row.name,
                                    ) ||
                                      rawString(
                                        row.keypair_name,
                                      ) ||
                                      rawString(
                                        row.id,
                                      ) ||
                                      "Unnamed"}
                                  </div>
                                </div>

                                <div className="max-h-[440px] overflow-y-auto py-2">
                                  {actionGroups.map(
                                    (
                                      group,
                                      groupIndex,
                                    ) => (
                                      <div
                                        key={
                                          group.name
                                        }
                                        className="py-1"
                                      >
                                        <div className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          {
                                            group.name
                                          }
                                        </div>

                                        {group.operations.map(
                                          (
                                            operation,
                                          ) => (
                                            <button
                                              key={
                                                operation.id
                                              }
                                              type="button"
                                              onClick={() =>
                                                openRowAction(
                                                  operation,
                                                  row,
                                                )
                                              }
                                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                                                isDestructive(
                                                  operation,
                                                )
                                                  ? "text-red-600"
                                                  : "text-slate-700"
                                              }`}
                                            >
                                              <span>
                                                {cleanOperationLabel(
                                                  operation,
                                                )}
                                              </span>

                                              <span className="text-xs text-slate-300">
                                                ›
                                              </span>
                                            </button>
                                          ),
                                        )}

                                        {groupIndex <
                                          actionGroups.length -
                                            1 && (
                                          <div className="mx-4 mt-2 border-t border-slate-100" />
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedAction && (
        <>
          <button
            type="button"
            aria-label="Close action panel"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={
              closeDrawer
            }
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="min-w-0 pr-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {selectedAction.row
                    ? "Resource action"
                    : `Create ${title
                        .toLowerCase()
                        .replace(
                          /s$/,
                          "",
                        )}`}
                </div>

                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {cleanOperationLabel(
                    selectedAction.operation,
                  )}
                </h2>

                {selectedAction.row && (
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {rawString(
                      selectedAction
                        .row.name,
                    ) ||
                      rawString(
                        selectedAction
                          .row.keypair_name,
                      ) ||
                      rawString(
                        selectedAction
                          .row.id,
                      ) ||
                      "Unnamed"}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={
                  closeDrawer
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <OperationRunner
                compact
                op={
                  selectedAction.operation
                }
                initialValues={
                  selectedAction.row
                    ? resourceValues(
                        selectedAction.row,
                      )
                    : {}
                }
                onSuccess={() => {
                  void query.refetch();

                  setTimeout(
                    closeDrawer,
                    600,
                  );
                }}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}