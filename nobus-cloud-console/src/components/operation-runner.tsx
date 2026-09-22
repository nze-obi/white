"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Play,
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
  Schema,
  primitiveType,
  schemaFields,
} from "@/lib/openapi";

import {
  useCloudContext,
} from "@/components/cloud-context";

import {
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

import {
  findArray,
  titleCase,
} from "@/lib/utils";

type OperationRunnerProps = {
  op: Operation;
  initialValues?: Record<string, unknown>;
  onSuccess?: (response: unknown) => void;
  compact?: boolean;
  submitLabel?: string;
};

type SmartOption = {
  value: string;
  label: string;
  description?: string;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
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

function nestedRecord(
  row: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value =
    row[key];

  if (
    isRecord(value)
  ) {
    return value;
  }

  return {};
}

function coerce(
  value: string,
  type: string,
) {
  if (value === "") {
    return undefined;
  }

  if (type === "boolean") {
    return value === "true";
  }

  if (
    type === "integer" ||
    type === "number"
  ) {
    return Number(value);
  }

  if (
    type === "array" ||
    type === "object"
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function isValidJson(
  value: string,
  type: string,
) {
  if (!value.trim()) {
    return true;
  }

  if (type !== "array" && type !== "object") {
    return true;
  }

  try {
    const parsed = JSON.parse(value);

    if (type === "array") {
      return Array.isArray(parsed);
    }

    return (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    );
  } catch {
    return false;
  }
}

function inputValue(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return JSON.stringify(value);
  }

  return String(value);
}

function fieldLabel(
  name: string,
) {
  const labels: Record<
    string,
    string
  > = {
    image: "Image",
    flavor: "Flavor",
    flavor_id:
      "New Flavor",

    network_id:
      "Network",

    net_id:
      "Network",

    port_id:
      "Port",

    fixed_ip:
      "Fixed IP Address",

    key_name:
      "SSH Keypair",

    security_groups:
      "Security Groups",

    security_group_name:
      "Security Group",

    volume_size:
      "Root Volume Size (GB)",

    admin_pass:
      "Admin Password",

    userdata:
      "User Data",

    size:
      "Size (GiB)",

    volume_type:
      "Volume Type",

    image_ref:
      "Image",

    snapshot_id:
      "Snapshot",

    source_volid:
      "Source Volume",

    metadata:
      "Metadata",

    server_id:
      "Instance",

    volume_id:
      "Volume",

    new_size:
      "New Size (GiB)",

    image_name:
      "Image Name",

    new_password:
      "New Password",

    reboot_type:
      "Reboot Type",

    console_type:
      "Console Type",

    length:
      "Console Lines",

    tag:
      "Tag",

    tags:
      "Tags",

    volume_types:
      "Volume Types",

    add_volumes:
      "Add Volumes",

    remove_volumes:
      "Remove Volumes",

    consistencygroup_id:
      "Consistency Group",

    az_name:
      "Availability Zone",

    delete_volume:
      "Delete Attached Root Volume",
  };

  if (
    labels[name]
  ) {
    return labels[name];
  }

  if (
    name.endsWith(
      "_id",
    )
  ) {
    return `${titleCase(
      name.slice(
        0,
        -3,
      ),
    )} ID`;
  }

  return titleCase(
    name,
  );
}

function optionNameValue(
  row: Record<string, unknown>,
) {
  const keypair =
    nestedRecord(
      row,
      "keypair",
    );

  const info =
    nestedRecord(
      row,
      "_info",
    );

  const data =
    nestedRecord(
      row,
      "data",
    );

  return (
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
    )
  );
}

function optionName(
  row: Record<string, unknown>,
) {
  const keypair =
    nestedRecord(
      row,
      "keypair",
    );

  const info =
    nestedRecord(
      row,
      "_info",
    );

  const data =
    nestedRecord(
      row,
      "data",
    );

  return (
    optionNameValue(
      row,
    ) ||
    rawString(
      row.label,
    ) ||
    rawString(
      row.display_name,
    ) ||
    rawString(
      keypair.label,
    ) ||
    rawString(
      info.label,
    ) ||
    rawString(
      data.label,
    )
  );
}

function optionId(
  row: Record<string, unknown>,
) {
  const keypair =
    nestedRecord(
      row,
      "keypair",
    );

  const info =
    nestedRecord(
      row,
      "_info",
    );

  const data =
    nestedRecord(
      row,
      "data",
    );

  return (
    rawString(
      row.id,
    ) ||
    rawString(
      row.uuid,
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
    optionNameValue(
      row,
    )
  );
}

function toOptions(
  data: unknown,
  valueField:
    | "id"
    | "name" = "id",
): SmartOption[] {
  const rows =
    findArray(
      data,
    );

  const unique =
    new Map<
      string,
      SmartOption
    >();

  for (
    const row of rows
  ) {
    const value =
      valueField ===
      "name"
        ? optionNameValue(
            row,
          )
        : optionId(
            row,
          );

    const label =
      optionName(
        row,
      );

    if (
      !value ||
      !label
    ) {
      continue;
    }

    if (
      unique.has(
        value,
      )
    ) {
      continue;
    }

    unique.set(
      value,
      {
        value,
        label,

        description:
          value !==
          label
            ? value
            : undefined,
      },
    );
  }

  return Array.from(
    unique.values(),
  );
}

/*
 * Dedicated Keypair parser.
 *
 * The live Nobus endpoint currently does not
 * always match the generated OpenAPI schema.
 *
 * Supported shapes:
 *
 * {
 *   status: true,
 *   data: [
 *     { id: "zabbix" },
 *     { id: "client" }
 *   ]
 * }
 *
 * {
 *   data: [
 *     { name: "zabbix" }
 *   ]
 * }
 *
 * {
 *   data: [
 *     {
 *       keypair: {
 *         name: "zabbix"
 *       }
 *     }
 *   ]
 * }
 *
 * {
 *   data: [
 *     "zabbix",
 *     "client"
 *   ]
 * }
 */
function keypairOptionsFromData(
  payload: unknown,
): SmartOption[] {
  const values:
    string[] = [];

  function add(
    value: unknown,
  ) {
    const text =
      rawString(
        value,
      );

    if (
      text &&
      !values.includes(
        text,
      )
    ) {
      values.push(
        text,
      );
    }
  }

  function visit(
    value: unknown,
    depth = 0,
  ) {
    if (
      depth > 6 ||
      value === null ||
      value === undefined
    ) {
      return;
    }

    if (
      typeof value ===
      "string"
    ) {
      add(
        value,
      );

      return;
    }

    if (
      Array.isArray(
        value,
      )
    ) {
      for (
        const item of
          value
      ) {
        visit(
          item,
          depth + 1,
        );
      }

      return;
    }

    if (
      !isRecord(
        value,
      )
    ) {
      return;
    }

    /*
     * First try to interpret the object itself
     * as one Keypair resource.
     */
    const keypair =
      nestedRecord(
        value,
        "keypair",
      );

    const info =
      nestedRecord(
        value,
        "_info",
      );

    const nestedData =
      nestedRecord(
        value,
        "data",
      );

    const candidate =
      rawString(
        value.name,
      ) ||
      rawString(
        value.keypair_name,
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
        nestedData.name,
      ) ||
      rawString(
        nestedData.keypair_name,
      ) ||
      /*
       * This is the important live Nobus
       * compatibility fallback.
       *
       * The current list response is returning:
       *
       * { id: "zabbix" }
       *
       * where `id` is actually the keypair name.
       */
      rawString(
        value.id,
      ) ||
      rawString(
        keypair.id,
      ) ||
      rawString(
        info.id,
      ) ||
      rawString(
        nestedData.id,
      );

    if (
      candidate
    ) {
      add(
        candidate,
      );

      /*
       * Once an object clearly looks like one
       * Keypair, do not recursively treat its
       * fingerprint/public key/etc. as separate
       * keypairs.
       */
      return;
    }

    /*
     * Response envelope. Only recurse through
     * likely container fields so status/message
     * strings never become fake keypairs.
     */
    const containerKeys = [
      "data",
      "items",
      "keypairs",
      "results",
      "records",
    ];

    for (
      const key of
        containerKeys
    ) {
      if (
        key in value
      ) {
        visit(
          value[key],
          depth + 1,
        );
      }
    }
  }

  visit(
    payload,
  );

  return values.map(
    (name) => ({
      value: name,
      label: name,
    }),
  );
}

function attachedSecurityGroupOptions(
  data: unknown,
): SmartOption[] {
  const rows =
    findArray(
      data,
    );

  const unique =
    new Map<
      string,
      SmartOption
    >();

  for (
    const row of rows
  ) {
    const securityGroup =
      nestedRecord(
        row,
        "security_group",
      );

    const name =
      rawString(
        row.name,
      ) ||
      rawString(
        row.security_group_name,
      ) ||
      rawString(
        securityGroup.name,
      );

    if (
      !name ||
      unique.has(
        name,
      )
    ) {
      continue;
    }

    unique.set(
      name,
      {
        value: name,
        label: name,
      },
    );
  }

  return Array.from(
    unique.values(),
  );
}

function portOptions(
  data: unknown,
): SmartOption[] {
  const rows =
    findArray(
      data,
    );

  const unique =
    new Map<
      string,
      SmartOption
    >();

  for (
    const row of rows
  ) {
    const port =
      nestedRecord(
        row,
        "port",
      );

    const value =
      rawString(
        row.port_id,
      ) ||
      rawString(
        row.id,
      ) ||
      rawString(
        row.uuid,
      ) ||
      rawString(
        port.id,
      );

    if (
      !value
    ) {
      continue;
    }

    const name =
      rawString(
        row.name,
      ) ||
      rawString(
        port.name,
      );

    const mac =
      rawString(
        row.mac_address,
      ) ||
      rawString(
        port.mac_address,
      );

    let fixedIp =
      "";

    const fixedIps =
      Array.isArray(
        row.fixed_ips,
      )
        ? row.fixed_ips
        : Array.isArray(
              port.fixed_ips,
            )
          ? port.fixed_ips
          : [];

    if (
      fixedIps.length >
      0
    ) {
      const first =
        fixedIps[0];

      if (
        isRecord(
          first,
        )
      ) {
        fixedIp =
          rawString(
            first.ip_address,
          );
      }
    }

    const label =
      name ||
      fixedIp ||
      mac ||
      value;

    const details =
      [
        fixedIp,
        mac,
      ].filter(
        Boolean,
      );

    if (
      unique.has(
        value,
      )
    ) {
      continue;
    }

    unique.set(
      value,
      {
        value,
        label,

        description:
          details.length >
          0
            ? details.join(
                " · ",
              )
            : value !==
                label
              ? value
              : undefined,
      },
    );
  }

  return Array.from(
    unique.values(),
  );
}

export function OperationRunner({
  op,
  initialValues = {},
  onSuccess,
  compact = false,
  submitLabel,
}: OperationRunnerProps) {
  const cloud =
    useCloudContext();

  const fields =
    useMemo(
      () =>
        schemaFields(
          op.requestSchema,
        ),
      [
        op.requestSchema,
      ],
    );

  const isCreateInstance =
    op.id ===
    "6bc0659b_controller_create_instance_api";

  const isResizeInstance =
    op.id ===
    "633a5a71_controller_resize_api";

  const isDeleteInstance =
    op.id ===
    "5b84ffc4_controller_delete_instance_api";

  const isCreateSecurityGroup =
    op.id ===
    "0526c762_controller_create_security_group_api";

  const isAttachSecurityGroup =
    op.id ===
    "dbc51aa9_controller_attach_security_group_api";

  const isRemoveSecurityGroup =
    op.id ===
    "a2c5e8fa_controller_remove_security_group_api";

  const isSecurityGroupAction =
    isAttachSecurityGroup ||
    isRemoveSecurityGroup;

  const isAttachNetworkInterface =
    op.id ===
    "03dfe4f6_controller_attach_network_interface_api";

  const isDetachNetworkInterface =
    op.id ===
    "1fabf604_controller_detach_network_interface_api";

  const isNetworkInterfaceAction =
    isAttachNetworkInterface ||
    isDetachNetworkInterface;

  const isCreateVolume =
    op.id ===
    "4adbf523_controller_create_volume_api";

  const isAttachVolume =
    op.id ===
    "ff8b3ada_controller_attach_volume_api";

  const isDetachVolume =
    op.id ===
    "242f6b79_controller_detach_volume_api";

  const isVolumeAttachmentAction =
    isAttachVolume ||
    isDetachVolume;

  const isCreateBackup =
    op.id ===
    "8b855b2a_controller_create_backup_api";

  const isRestoreBackup =
    op.id ===
    "83f9c8a6_controller_restore_backup_api";

  const isCreateVolumeTransfer =
    op.id ===
    "0ce96602_controller_create_volume_transfer_api";

  const isAcceptVolumeTransfer =
    op.id ===
    "baeef80e_controller_accept_volume_transfer_api";

  const isCreateConsistencyGroup =
    op.id ===
    "edd1f89b_controller_create_consistency_group_api";

  const isUpdateConsistencyGroup =
    op.id ===
    "54dfe8d1_controller_update_consistency_group_api";

  const isCreateConsistencyGroupSnapshot =
    op.id ===
    "1cd00feb_controller_create_consistency_group_snapshot_api";

  const isCreateRouter =
    op.id ===
    "aadc08d7_controller_create_router_api";

  const isUpdateRouter =
    op.id ===
    "833ed898_controller_update_router_api";

  const isAddRouterInterface =
    op.id ===
    "5eb241b4_controller_add_router_interface_api";

  const isRemoveRouterInterface =
    op.id ===
    "c1663d4e_controller_remove_router_interface_api";

  const isRouterInterfaceAction =
    isAddRouterInterface ||
    isRemoveRouterInterface;

  const isCreateFloatingIp =
    op.id ===
    "9040a8bd_controller_create_floating_ip_api";

  const isUpdateFloatingIp =
    op.id ===
    "60378653_controller_update_floating_ip_api";

  const isCreatePort =
    op.id ===
    "fac2f2df_controller_create_port_api";

  const isUpdatePort =
    op.id ===
    "197416ca_controller_update_port_api";

  const isSetPortAddressPairs =
    op.id ===
    "0f15cb05_controller_set_port_address_pairs_api";

  const isCreateSubnet =
    op.id ===
    "7b834ebe_controller_create_subnet_api";

  const isUpdateSubnet =
    op.id ===
    "f47f4b5b_controller_update_subnet_api";

  const isCreateTrunk =
    op.id ===
    "2e05e17a_controller_create_trunk_api";

  const isUpdateTrunk =
    op.id ===
    "62d45f10_controller_update_trunk_api";

  const isCreateQosPolicy =
    op.id ===
    "f027212e_controller_create_qos_policy_api";

  const isUpdateQosPolicy =
    op.id ===
    "872e861d_controller_update_qos_policy_api";

  const isCreateFirewallGroup =
    op.id ===
    "8ee52f41_controller_create_firewall_group_api";

  const isUpdateFirewallGroup =
    op.id ===
    "36dd7108_controller_update_firewall_group_api";

  const isUploadObject =
    op.id ===
    "48fbc1e9_controller_upload_object_api";

  const isSmartNetworkingBody =
    isCreateRouter ||
    isUpdateRouter ||
    isCreateFloatingIp ||
    isUpdateFloatingIp ||
    isCreatePort ||
    isUpdatePort ||
    isSetPortAddressPairs ||
    isCreateSubnet ||
    isUpdateSubnet ||
    isCreateTrunk ||
    isUpdateTrunk ||
    isCreateQosPolicy ||
    isUpdateQosPolicy ||
    isCreateFirewallGroup ||
    isUpdateFirewallGroup;

  const needsSmartReferences =
    isCreateInstance ||
    isResizeInstance ||
    isSecurityGroupAction ||
    isNetworkInterfaceAction ||
    isCreateVolume ||
    isVolumeAttachmentAction ||
    isCreateBackup ||
    isRestoreBackup ||
    isCreateVolumeTransfer ||
    isCreateConsistencyGroup ||
    isUpdateConsistencyGroup ||
    isCreateConsistencyGroupSnapshot ||
    isCreateRouter ||
    isUpdateRouter ||
    isRouterInterfaceAction ||
    isCreateFloatingIp ||
    isUpdateFloatingIp ||
    isCreatePort ||
    isUpdatePort ||
    isSetPortAddressPairs ||
    isCreateSubnet ||
    isUpdateSubnet ||
    isCreateTrunk ||
    isUpdateTrunk ||
    isCreateFirewallGroup ||
    isUpdateFirewallGroup;

  const referenceQuery =
    useMemo(
      () => ({
        project_id:
          cloud.projectId,

        availability_zone:
          cloud.availabilityZone,
      }),
      [
        cloud.projectId,
        cloud.availabilityZone,
      ],
    );

  const referencesEnabled =
    needsSmartReferences &&
    Boolean(
      cloud.projectId &&
        cloud.availabilityZone,
    );

  const selectedServerId =
    rawString(
      initialValues.server_id ??
        initialValues.instance_id ??
        initialValues.id,
    );

  const imagesQuery =
    useQuery({
      queryKey: [
        "smart-images",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateInstance ||
          isCreateVolume
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/image/${qs(
            referenceQuery,
          )}`,
        ),
    });

  const instancesQuery =
    useQuery({
      queryKey: [
        "smart-instances",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        isVolumeAttachmentAction,

      queryFn: () =>
        apiRequest(
          `/api/v3/instance/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const flavorsQuery =
    useQuery({
      queryKey: [
        "smart-flavors",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateInstance ||
          isResizeInstance
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/flavor/${qs(
            referenceQuery,
          )}`,
        ),
    });

  const networksQuery =
    useQuery({
      queryKey: [
        "smart-networks",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateInstance ||
          isAttachNetworkInterface ||
          isCreateRouter ||
          isUpdateRouter ||
          isCreateFloatingIp ||
          isCreatePort ||
          isCreateSubnet
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/network/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const portsQuery =
    useQuery({
      queryKey: [
        "smart-ports",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isAttachNetworkInterface ||
          isRouterInterfaceAction ||
          isCreateFloatingIp ||
          isUpdateFloatingIp ||
          isCreatePort ||
          isUpdatePort ||
          isSetPortAddressPairs ||
          isCreateTrunk ||
          isUpdateTrunk ||
          isCreateFirewallGroup ||
          isUpdateFirewallGroup
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/network/port/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const subnetsQuery =
    useQuery({
      queryKey: [
        "smart-subnets",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isRouterInterfaceAction ||
          isCreatePort ||
          isUpdatePort
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/network/subnet/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const attachedInterfacesQuery =
    useQuery({
      queryKey: [
        "instance-network-interfaces",
        selectedServerId,
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        isDetachNetworkInterface &&
        Boolean(
          selectedServerId,
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/instance/network-interfaces${qs(
            {
              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,

              server_id:
                selectedServerId,
            },
          )}`,
        ),
    });

  /*
   * Keep the trailing slash here.
   *
   * Your proxy + Next config were already fixed
   * specifically so /api/v3/keypair/ does not
   * redirect and accidentally change behavior.
   */
  const keypairsQuery =
    useQuery({
      queryKey: [
        "instance-create-keypairs",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        isCreateInstance &&
        referencesEnabled,

      queryFn: () =>
        apiRequest(
          `/api/v3/keypair/${qs(
            referenceQuery,
          )}`,
        ),
    });

  const securityGroupsQuery =
    useQuery({
      queryKey: [
        "project-security-groups",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateInstance ||
          isAttachSecurityGroup ||
          isCreatePort ||
          isUpdatePort
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/network/security-group/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const attachedSecurityGroupsQuery =
    useQuery({
      queryKey: [
        "instance-security-groups",
        selectedServerId,
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        isRemoveSecurityGroup &&
        Boolean(
          selectedServerId,
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/instance/security-groups${qs(
            {
              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,

              server_id:
                selectedServerId,
            },
          )}`,
        ),
    });

  const volumeTypesQuery =
    useQuery({
      queryKey: [
        "volume-create-types",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateVolume ||
          isCreateConsistencyGroup
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/volume/volume_type/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const volumesQuery =
    useQuery({
      queryKey: [
        "backup-volume-options",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateBackup ||
          isRestoreBackup ||
          isCreateVolumeTransfer ||
          isUpdateConsistencyGroup
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/volume/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const snapshotsQuery =
    useQuery({
      queryKey: [
        "backup-snapshot-options",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        isCreateBackup,

      queryFn: () =>
        apiRequest(
          `/api/v3/volume/snapshot/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const consistencyGroupsQuery =
    useQuery({
      queryKey: [
        "consistency-group-options",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        (
          isCreateConsistencyGroupSnapshot ||
          isCreateConsistencyGroup
        ),

      queryFn: () =>
        apiRequest(
          `/api/v3/volume/consistency_group/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const consistencyGroupSnapshotsQuery =
    useQuery({
      queryKey: [
        "consistency-group-snapshot-options",
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled:
        referencesEnabled &&
        isCreateConsistencyGroup,

      queryFn: () =>
        apiRequest(
          `/api/v3/volume/consistency_group/snapshot/list${qs(
            referenceQuery,
          )}`,
        ),
    });

  const imageOptions =
    useMemo(
      () =>
        toOptions(
          imagesQuery.data,
        ),
      [
        imagesQuery.data,
      ],
    );

  const instanceOptions =
    useMemo(
      () =>
        toOptions(
          instancesQuery.data,
        ),
      [
        instancesQuery.data,
      ],
    );

  const flavorOptions =
    useMemo(
      () =>
        toOptions(
          flavorsQuery.data,
        ),
      [
        flavorsQuery.data,
      ],
    );

  const networkOptions =
    useMemo(
      () =>
        toOptions(
          networksQuery.data,
        ),
      [
        networksQuery.data,
      ],
    );

  const availablePortOptions =
    useMemo(
      () =>
        portOptions(
          portsQuery.data,
        ),
      [
        portsQuery.data,
      ],
    );

  const subnetOptions =
    useMemo(
      () =>
        toOptions(
          subnetsQuery.data,
        ),
      [
        subnetsQuery.data,
      ],
    );

  const attachedPortOptions =
    useMemo(
      () =>
        portOptions(
          attachedInterfacesQuery.data,
        ),
      [
        attachedInterfacesQuery.data,
      ],
    );

  /*
   * IMPORTANT FIX:
   *
   * Do NOT use generic toOptions() for Keypairs.
   *
   * The live endpoint is currently returning
   * keypair names through its `id` field.
   */
  const keypairOptions =
    useMemo(
      () =>
        keypairOptionsFromData(
          keypairsQuery.data,
        ),
      [
        keypairsQuery.data,
      ],
    );

  const securityGroupOptions =
    useMemo(
      () =>
        toOptions(
          securityGroupsQuery.data,
          "name",
        ),
      [
        securityGroupsQuery.data,
      ],
    );

  const attachedGroupOptions =
    useMemo(
      () =>
        attachedSecurityGroupOptions(
          attachedSecurityGroupsQuery.data,
        ),
      [
        attachedSecurityGroupsQuery.data,
      ],
    );

  const volumeTypeOptions =
    useMemo(
      () =>
        toOptions(
          volumeTypesQuery.data,
          "name",
        ),
      [
        volumeTypesQuery.data,
      ],
    );

  const volumeTypeIdOptions =
    useMemo(
      () =>
        toOptions(
          volumeTypesQuery.data,
        ),
      [
        volumeTypesQuery.data,
      ],
    );

  const volumeOptions =
    useMemo(
      () =>
        toOptions(
          volumesQuery.data,
        ),
      [
        volumesQuery.data,
      ],
    );

  const snapshotOptions =
    useMemo(
      () =>
        toOptions(
          snapshotsQuery.data,
        ),
      [
        snapshotsQuery.data,
      ],
    );

  const consistencyGroupOptions =
    useMemo(
      () =>
        toOptions(
          consistencyGroupsQuery.data,
        ),
      [
        consistencyGroupsQuery.data,
      ],
    );

  const consistencyGroupSnapshotOptions =
    useMemo(
      () =>
        toOptions(
          consistencyGroupSnapshotsQuery.data,
        ),
      [
        consistencyGroupSnapshotsQuery.data,
      ],
    );

  const initialKey =
    JSON.stringify(
      initialValues,
    );

  const [
    values,
    setValues,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    files,
    setFiles,
  ] =
    useState<
      Record<
        string,
        File
      >
    >({});

  const [
    params,
    setParams,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    busy,
    setBusy,
  ] =
    useState(
      false,
    );

  const [
    result,
    setResult,
  ] =
    useState<unknown>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<unknown>(
      null,
    );

  const [
    validationError,
    setValidationError,
  ] =
    useState<
      string | null
    >(null);

  const [
    confirmOpen,
    setConfirmOpen,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      const nextValues:
        Record<
          string,
          string
        > = {};

      const nextParams:
        Record<
          string,
          string
        > = {};

      const normalizedInitialValues =
        JSON.parse(
          initialKey,
        ) as Record<
          string,
          unknown
        >;

      for (
        const field of
          fields
      ) {
        if (
          isCreateVolume &&
          field.name ===
            "multiattach"
        ) {
          continue;
        }

        if (
          normalizedInitialValues[
            field.name
          ] !== undefined
        ) {
          nextValues[
            field.name
          ] =
            inputValue(
              normalizedInitialValues[
                field.name
              ],
            );
        } else if (
          field.schema
            ?.default !==
          undefined
        ) {
          nextValues[
            field.name
          ] =
            inputValue(
              field.schema
                .default,
            );
        }
      }

      for (
        const parameter of
          op.parameters
      ) {
        if (
          normalizedInitialValues[
            parameter.name
          ] !==
          undefined
        ) {
          nextParams[
            parameter.name
          ] =
            inputValue(
              normalizedInitialValues[
                parameter.name
              ],
            );
        }
      }

      if (
        isCreateInstance
      ) {
        if (
          nextValues[
            "volume_size"
          ] === undefined
        ) {
          nextValues[
            "volume_size"
          ] = "50";
        }

        if (
          nextValues[
            "security_groups"
          ] === undefined
        ) {
          nextValues[
            "security_groups"
          ] =
            JSON.stringify(
              [
                "default",
              ],
            );
        }

        if (
          nextValues[
            "nics"
          ] === undefined
        ) {
          nextValues[
            "nics"
          ] =
            "auto";
        }
      }

      if (
        isCreateVolume
      ) {
        if (
          nextValues[
            "size"
          ] === undefined
        ) {
          nextValues[
            "size"
          ] =
            "50";
        }

        if (
          nextValues[
            "metadata"
          ] === undefined
        ) {
          nextValues[
            "metadata"
          ] =
            "{}";
        }
      }

      setValues(
        nextValues,
      );

      setParams(
        nextParams,
      );

      setFiles(
        {},
      );

      setResult(
        null,
      );

      setError(
        null,
      );

      setValidationError(
        null,
      );

      setConfirmOpen(
        false,
      );
    },
    [
      op.id,
      op.parameters,
      fields,
      initialKey,
      isCreateInstance,
      isCreateVolume,
    ],
  );

  const destructive =
    op.method ===
      "delete" ||
    /delete|remove|clear|invalidate|detach|shutdown|revert/i.test(
      op.summary,
    );

  function auto(
    name: string,
  ) {
    if (
      initialValues[
        name
      ] !==
      undefined
    ) {
      return inputValue(
        initialValues[
          name
        ],
      );
    }

    if (
      name ===
      "project_id"
    ) {
      return cloud.projectId;
    }

    if (
      name ===
      "availability_zone"
    ) {
      return cloud.availabilityZone;
    }

    if (
      name ===
      "az_name"
    ) {
      return cloud.availabilityZone;
    }

    return "";
  }

  function hidden(
    name: string,
  ) {
    return (
      name ===
        "project_id" ||
      name ===
        "availability_zone" ||
      name ===
        "az_name" ||
      initialValues[
        name
      ] !== undefined
    );
  }

  const visibleParameters =
    op.parameters.filter(
      (
        parameter,
      ) =>
        !hidden(
          parameter.name,
        ),
    );

  const visibleFields =
    fields.filter(
      (field) => {
        if (
          hidden(
            field.name,
          )
        ) {
          return false;
        }

        if (
          isSmartNetworkingBody &&
          field.name === "exclude_none"
        ) {
          return false;
        }

        if (
          isCreateInstance &&
          field.name ===
            "nics"
        ) {
          return false;
        }

        if (
          isCreateSecurityGroup &&
          field.name ===
            "security_group"
        ) {
          return false;
        }

        if (
          isSmartNetworkingBody &&
          [
            "router",
            "floatingip",
            "port",
            "subnet",
            "trunk",
            "policy",
            "firewall_group",
            "address_pairs",
          ].includes(
            field.name,
          )
        ) {
          return false;
        }

        if (
          isCreateVolume &&
          field.name ===
            "multiattach"
        ) {
          return false;
        }

        if (
          isUploadObject &&
          field.name ===
            "payload"
        ) {
          return false;
        }

        if (
          isCreateBackup &&
          field.name ===
            "metadata"
        ) {
          return false;
        }

        if (
          isCreateConsistencyGroupSnapshot &&
          field.name ===
            "metadata"
        ) {
          return false;
        }

        if (
          isCreateConsistencyGroup &&
          field.name ===
            "volume_types"
        ) {
          return false;
        }

        if (
          isUpdateConsistencyGroup &&
          (
            field.name ===
              "add_volumes" ||
            field.name ===
              "remove_volumes"
          )
        ) {
          return false;
        }

        return true;
      },
    );

  function smartOptions(
    name: string,
  ):
    | SmartOption[]
    | undefined {
    if (
      isCreateInstance
    ) {
      if (
        name ===
        "image"
      ) {
        return imageOptions;
      }

      if (
        name ===
        "flavor"
      ) {
        return flavorOptions;
      }

      if (
        name ===
        "network_id"
      ) {
        return networkOptions;
      }

      if (
        name ===
        "key_name"
      ) {
        return keypairOptions;
      }
    }

    if (
      isResizeInstance &&
      name ===
        "flavor_id"
    ) {
      return flavorOptions;
    }

    if (
      isAttachSecurityGroup &&
      name ===
        "security_group_name"
    ) {
      return securityGroupOptions;
    }

    if (
      isRemoveSecurityGroup &&
      name ===
        "security_group_name"
    ) {
      return attachedGroupOptions;
    }

    if (
      isAttachNetworkInterface &&
      name ===
        "net_id"
    ) {
      return networkOptions;
    }

    if (
      isAttachNetworkInterface &&
      name ===
        "port_id"
    ) {
      return availablePortOptions;
    }

    if (
      isDetachNetworkInterface &&
      name ===
        "port_id"
    ) {
      return attachedPortOptions;
    }

    if (
      isCreateVolume
    ) {
      if (
        name ===
        "volume_type"
      ) {
        return volumeTypeOptions;
      }

      if (
        name ===
        "image_ref"
      ) {
        return imageOptions;
      }
    }

    if (
      isVolumeAttachmentAction &&
      name ===
        "server_id"
    ) {
      return instanceOptions;
    }

    if (
      (
        isCreateBackup ||
        isRestoreBackup ||
        isCreateVolumeTransfer
      ) &&
      name ===
        "volume_id"
    ) {
      return volumeOptions;
    }

    if (
      isCreateBackup &&
      name ===
        "snapshot_id"
    ) {
      return snapshotOptions;
    }

    if (
      isCreateConsistencyGroupSnapshot &&
      name ===
        "consistencygroup_id"
    ) {
      return consistencyGroupOptions;
    }

    if (
      isCreateConsistencyGroup &&
      name ===
        "source_cgid"
    ) {
      return consistencyGroupOptions;
    }

    if (
      isCreateConsistencyGroup &&
      name ===
        "cgsnapshot_id"
    ) {
      return consistencyGroupSnapshotOptions;
    }

    return undefined;
  }

  function optionsLoading(
    name: string,
  ) {
    if (
      isCreateInstance
    ) {
      if (
        name ===
        "image"
      ) {
        return imagesQuery.isLoading;
      }

      if (
        name ===
        "flavor"
      ) {
        return flavorsQuery.isLoading;
      }

      if (
        name ===
        "network_id"
      ) {
        return networksQuery.isLoading;
      }

      if (
        name ===
        "key_name"
      ) {
        return keypairsQuery.isLoading;
      }
    }

    if (
      isResizeInstance &&
      name ===
        "flavor_id"
    ) {
      return flavorsQuery.isLoading;
    }

    if (
      isAttachSecurityGroup &&
      name ===
        "security_group_name"
    ) {
      return securityGroupsQuery.isLoading;
    }

    if (
      isRemoveSecurityGroup &&
      name ===
        "security_group_name"
    ) {
      return attachedSecurityGroupsQuery.isLoading;
    }

    if (
      isAttachNetworkInterface &&
      name ===
        "net_id"
    ) {
      return networksQuery.isLoading;
    }

    if (
      isAttachNetworkInterface &&
      name ===
        "port_id"
    ) {
      return portsQuery.isLoading;
    }

    if (
      isDetachNetworkInterface &&
      name ===
        "port_id"
    ) {
      return attachedInterfacesQuery.isLoading;
    }

    if (
      isCreateVolume
    ) {
      if (
        name ===
        "volume_type"
      ) {
        return volumeTypesQuery.isLoading;
      }

      if (
        name ===
        "image_ref"
      ) {
        return imagesQuery.isLoading;
      }
    }

    if (
      isVolumeAttachmentAction &&
      name ===
        "server_id"
    ) {
      return instancesQuery.isLoading;
    }

    if (
      (
        isCreateBackup ||
        isRestoreBackup ||
        isCreateVolumeTransfer
      ) &&
      name ===
        "volume_id"
    ) {
      return volumesQuery.isLoading;
    }

    if (
      isCreateBackup &&
      name ===
        "snapshot_id"
    ) {
      return snapshotsQuery.isLoading;
    }

    if (
      isCreateConsistencyGroupSnapshot &&
      name ===
        "consistencygroup_id"
    ) {
      return consistencyGroupsQuery.isLoading;
    }

    if (
      isCreateConsistencyGroup &&
      name ===
        "source_cgid"
    ) {
      return consistencyGroupsQuery.isLoading;
    }

    if (
      isCreateConsistencyGroup &&
      name ===
        "cgsnapshot_id"
    ) {
      return consistencyGroupSnapshotsQuery.isLoading;
    }

    return false;
  }

  function optionsError(
    name: string,
  ): string {
    if (
      isCreateInstance &&
      name ===
        "key_name" &&
      keypairsQuery.isError
    ) {
      return (
        keypairsQuery
          .error instanceof
        Error
          ? keypairsQuery
              .error
              .message
          : "Unable to load keypairs."
      );
    }

    return "";
  }

  function setBodyValue(
    name: string,
    value: string,
  ) {
    setValidationError(
      null,
    );

    setValues(
      (
        current,
      ) => {
        const next = {
          ...current,
          [name]:
            value,
        };

        if (
          isAttachNetworkInterface
        ) {
          if (
            name ===
              "net_id" &&
            value
          ) {
            next.port_id =
              "";
          }

          if (
            name ===
              "port_id" &&
            value
          ) {
            next.net_id =
              "";

            next.fixed_ip =
              "";
          }
        }

        return next;
      },
    );
  }

  function validate() {
    if (
      !cloud.projectId
    ) {
      return "Select a project first.";
    }

    if (
      !cloud.availabilityZone
    ) {
      return "Select an availability zone first.";
    }

    for (
      const parameter of
        op.parameters
    ) {
      if (
        !parameter.required
      ) {
        continue;
      }

      const value =
        params[
          parameter.name
        ] ??
        auto(
          parameter.name,
        );

      if (
        !String(
          value ??
            "",
        ).trim()
      ) {
        return `${fieldLabel(
          parameter.name,
        )} is required.`;
      }
    }

    for (
      const parameter of
        op.parameters
    ) {
      const type =
        primitiveType(
          parameter.schema || {},
        );

      const raw =
        params[parameter.name] ??
        auto(parameter.name);

      if (
        (type === "array" || type === "object") &&
        raw &&
        !isValidJson(String(raw), type)
      ) {
        return `${fieldLabel(parameter.name)} must contain valid ${type === "array" ? "JSON array" : "JSON object"}.`;
      }
    }

    if (
      isCreateSecurityGroup &&
      !values.security_group_name?.trim()
    ) {
      return "Security group name is required.";
    }

    for (
      const field of
        fields
    ) {
      if (
        field.schema?.format === "binary"
      ) {
        if (
          field.required &&
          !files[field.name]
        ) {
          return `${fieldLabel(field.name)} file is required.`;
        }

        continue;
      }

      if (
        isCreateVolume &&
        field.name ===
          "multiattach"
      ) {
        continue;
      }

      if (
        isCreateSecurityGroup &&
        field.name ===
          "security_group"
      ) {
        continue;
      }

      if (
        isSmartNetworkingBody &&
        [
          "router",
          "floatingip",
          "port",
          "subnet",
          "trunk",
          "policy",
          "firewall_group",
          "address_pairs",
        ].includes(
          field.name,
        )
      ) {
        continue;
      }

      if (
        isUploadObject &&
        field.name ===
          "payload"
      ) {
        continue;
      }

      if (
        isCreateBackup &&
        field.name ===
          "metadata"
      ) {
        continue;
      }

      if (
        isCreateConsistencyGroupSnapshot &&
        field.name ===
          "metadata"
      ) {
        continue;
      }

      if (
        isCreateConsistencyGroup &&
        field.name ===
          "volume_types"
      ) {
        continue;
      }

      if (
        isUpdateConsistencyGroup &&
        (
          field.name ===
            "add_volumes" ||
          field.name ===
            "remove_volumes"
        )
      ) {
        continue;
      }

      if (
        !field.required
      ) {
        continue;
      }

      const value =
        values[
          field.name
        ] ??
        auto(
          field.name,
        );

      if (
        !String(
          value ??
            "",
        ).trim()
      ) {
        return `${fieldLabel(
          field.name,
        )} is required.`;
      }

      const type =
        primitiveType(field.schema);

      if (
        (type === "array" || type === "object") &&
        !isValidJson(String(value), type)
      ) {
        return `${fieldLabel(field.name)} must contain valid ${type === "array" ? "JSON array" : "JSON object"}.`;
      }
    }

    if (
      isCreateInstance &&
      !keypairsQuery.isLoading &&
      keypairsQuery.isError
    ) {
      return "The keypair list could not be loaded.";
    }

    if (
      isAttachNetworkInterface
    ) {
      const portId =
        values.port_id
          ?.trim();

      const networkId =
        values.net_id
          ?.trim();

      if (
        portId &&
        networkId
      ) {
        return "Choose either an existing Port or a Network, not both.";
      }

      if (
        !portId &&
        !networkId
      ) {
        return "Choose a Network or an existing Port to attach.";
      }
    }

    if (
      isCreateRouter &&
      !values.router_name?.trim()
    ) {
      return "Router name is required.";
    }

    if (
      isRouterInterfaceAction
    ) {
      const subnetId =
        values.router_subnet_id?.trim();
      const portId =
        values.router_port_id?.trim();

      if (Boolean(subnetId) === Boolean(portId)) {
        return "Choose exactly one Subnet or Port.";
      }
    }

    if (
      isCreateFloatingIp &&
      !values.fip_network_id?.trim()
    ) {
      return "External network is required.";
    }

    if (
      isCreatePort &&
      !values.port_network_id?.trim()
    ) {
      return "Network is required.";
    }

    if (
      isSetPortAddressPairs &&
      !values.address_pair_ip?.trim()
    ) {
      return "IP address is required.";
    }

    if (
      isCreateSubnet &&
      (
        !values.subnet_network_id?.trim() ||
        !values.subnet_cidr?.trim()
      )
    ) {
      return "Network and CIDR are required.";
    }

    if (
      isCreateTrunk &&
      (
        !values.trunk_name?.trim() ||
        !values.trunk_port_id?.trim()
      )
    ) {
      return "Trunk name and parent port are required.";
    }

    if (
      isCreateQosPolicy &&
      !values.qos_name?.trim()
    ) {
      return "QoS policy name is required.";
    }

    if (
      isCreateFirewallGroup &&
      !values.firewall_name?.trim()
    ) {
      return "Firewall group name is required.";
    }

    if (isUploadObject) {
      if (!values.object_container_name?.trim()) {
        return "Container is required.";
      }

      if (!files.file_data) {
        return "Choose a file to upload.";
      }
    }

    if (
      isCreateVolume
    ) {
      const size =
        Number(
          values.size,
        );

      if (
        !Number.isFinite(
          size,
        ) ||
        size < 1
      ) {
        return "Volume size must be at least 1 GiB.";
      }
    }

    return null;
  }

  function requestRun() {
    const message =
      validate();

    if (
      message
    ) {
      setValidationError(
        message,
      );

      return;
    }

    setValidationError(
      null,
    );

    if (
      destructive
    ) {
      setConfirmOpen(
        true,
      );

      return;
    }

    void run();
  }

  async function run() {
    setConfirmOpen(
      false,
    );

    setBusy(
      true,
    );

    setError(
      null,
    );

    setResult(
      null,
    );

    try {
      const query:
        Record<
          string,
          unknown
        > = {};

      for (
        const parameter of
          op.parameters
      ) {
        const value =
          coerce(
            params[
              parameter.name
            ] ??
              auto(
                parameter.name,
              ),

            primitiveType(
              parameter.schema ||
                {},
            ),
          );

        if (
          value !==
          undefined
        ) {
          query[
            parameter.name
          ] = value;
        }
      }

      let path =
        op.path;

      for (
        const parameter of
          op.parameters.filter(
            (
              item,
            ) =>
              item.in ===
              "path",
          )
      ) {
        path =
          path.replace(
            `{${parameter.name}}`,
            encodeURIComponent(
              String(
                query[
                  parameter.name
                ] ??
                  "",
              ),
            ),
          );

        delete query[
          parameter.name
        ];
      }

      const body:
        Record<
          string,
          unknown
        > = {};

      for (
        const field of
          fields
      ) {
        if (
          field.schema
            ?.format ===
          "binary"
        ) {
          continue;
        }

        if (
          isCreateVolume &&
          field.name ===
            "multiattach"
        ) {
          continue;
        }

        if (
          isCreateSecurityGroup &&
          field.name ===
            "security_group"
        ) {
          continue;
        }

        if (
          isSmartNetworkingBody &&
          [
            "router",
            "floatingip",
            "port",
            "subnet",
            "trunk",
            "policy",
            "firewall_group",
            "address_pairs",
          ].includes(
            field.name,
          )
        ) {
          continue;
        }

        if (
          isCreateBackup &&
          field.name ===
            "metadata"
        ) {
          continue;
        }

        if (
          isCreateConsistencyGroupSnapshot &&
          field.name ===
            "metadata"
        ) {
          continue;
        }

        let raw =
          values[
            field.name
          ] ??
          auto(
            field.name,
          );

        if (
          isCreateInstance &&
          field.name ===
            "nics" &&
          !raw
        ) {
          raw =
            "auto";
        }

        const value =
          coerce(
            raw,

            primitiveType(
              field.schema,
            ),
          );

        if (
          value !==
          undefined
        ) {
          body[
            field.name
          ] = value;
        }
      }

      if (
        isCreateSecurityGroup
      ) {
        const tags =
          (values.security_group_tags || "")
            .split(",")
            .map((tag) =>
              tag.trim(),
            )
            .filter(Boolean);

        body.security_group = {
          name:
            values.security_group_name.trim(),
          description:
            values.security_group_description?.trim() ||
            `Security Group for ${cloud.projectId}`,
          ...(tags.length > 0
            ? { tags }
            : {}),
        };
      }

      const csv = (value: string | undefined) =>
        (value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      if (
        isCreateRouter ||
        isUpdateRouter
      ) {
        const router: Record<string, unknown> = {};

        if (values.router_name?.trim()) {
          router.name = values.router_name.trim();
        }

        if (values.router_admin_state_up) {
          router.admin_state_up =
            values.router_admin_state_up === "true";
        }

        if (values.router_description?.trim()) {
          router.description = values.router_description.trim();
        }

        const routerTags = csv(values.router_tags);
        if (routerTags.length) {
          router.tags = routerTags;
        }

        if (values.router_external_network_id?.trim()) {
          router.external_gateway_info = {
            network_id: values.router_external_network_id.trim(),
            enable_snat:
              values.router_enable_snat !== "false",
          };
        }

        body.router = router;
      }

      if (
        isCreateFloatingIp ||
        isUpdateFloatingIp
      ) {
        const floatingip: Record<string, unknown> = {};

        if (isCreateFloatingIp) {
          floatingip.floating_network_id =
            values.fip_network_id?.trim();
        }

        if (values.fip_port_id?.trim()) {
          floatingip.port_id = values.fip_port_id.trim();
        }

        if (values.fip_fixed_ip?.trim()) {
          floatingip.fixed_ip_address = values.fip_fixed_ip.trim();
        }

        if (values.fip_description?.trim()) {
          floatingip.description = values.fip_description.trim();
        }

        const fipTags = csv(values.fip_tags);
        if (fipTags.length) {
          floatingip.tags = fipTags;
        }

        body.floatingip = floatingip;
      }

      if (
        isCreatePort ||
        isUpdatePort
      ) {
        const port: Record<string, unknown> = {};

        if (isCreatePort) {
          port.network_id = values.port_network_id?.trim();
        }

        if (values.port_name?.trim()) {
          port.name = values.port_name.trim();
        }

        if (values.port_admin_state_up) {
          port.admin_state_up = values.port_admin_state_up === "true";
        }

        if (values.port_security_enabled) {
          port.port_security_enabled = values.port_security_enabled === "true";
        }

        if (values.port_vnic_type?.trim()) {
          port["binding:vnic_type"] = values.port_vnic_type.trim();
        }

        if (values.port_dns_name?.trim()) {
          port.dns_name = values.port_dns_name.trim();
        }

        if (values.port_description?.trim()) {
          port.description = values.port_description.trim();
        }

        const portTags = csv(values.port_tags);
        if (portTags.length) {
          port.tags = portTags;
        }

        try {
          const selectedGroups = JSON.parse(values.port_security_groups || "[]");
          if (Array.isArray(selectedGroups) && selectedGroups.length) {
            port.security_groups = selectedGroups;
          }
        } catch {
          // MultiSelectField always writes valid JSON.
        }

        if (values.port_fixed_subnet_id?.trim()) {
          port.fixed_ips = [
            {
              subnet_id: values.port_fixed_subnet_id.trim(),
              ...(values.port_fixed_ip?.trim()
                ? { ip_address: values.port_fixed_ip.trim() }
                : {}),
            },
          ];
        }

        if (values.port_allowed_ip?.trim()) {
          port.allowed_address_pairs = [
            {
              ip_address: values.port_allowed_ip.trim(),
              ...(values.port_allowed_mac?.trim()
                ? { mac_address: values.port_allowed_mac.trim() }
                : {}),
            },
          ];
        }

        body.port = port;
      }

      if (isSetPortAddressPairs) {
        body.address_pairs = [
          {
            ip_address: values.address_pair_ip.trim(),
            ...(values.address_pair_mac?.trim()
              ? { mac_address: values.address_pair_mac.trim() }
              : {}),
          },
        ];
      }

      if (
        isCreateSubnet ||
        isUpdateSubnet
      ) {
        const subnet: Record<string, unknown> = {};

        if (isCreateSubnet) {
          subnet.network_id = values.subnet_network_id?.trim();
          subnet.cidr = values.subnet_cidr?.trim();
          subnet.ip_version = Number(values.subnet_ip_version || "4");
        }

        if (values.subnet_name?.trim()) {
          subnet.name = values.subnet_name.trim();
        }

        if (values.subnet_enable_dhcp) {
          subnet.enable_dhcp = values.subnet_enable_dhcp === "true";
        }

        if (values.subnet_gateway_ip?.trim()) {
          subnet.gateway_ip = values.subnet_gateway_ip.trim();
        }

        const dns = csv(values.subnet_dns);
        if (dns.length) {
          subnet.dns_nameservers = dns;
        }

        if (
          values.subnet_pool_start?.trim() &&
          values.subnet_pool_end?.trim()
        ) {
          subnet.allocation_pools = [
            {
              start: values.subnet_pool_start.trim(),
              end: values.subnet_pool_end.trim(),
            },
          ];
        }

        if (
          values.subnet_route_destination?.trim() &&
          values.subnet_route_nexthop?.trim()
        ) {
          subnet.host_routes = [
            {
              destination: values.subnet_route_destination.trim(),
              nexthop: values.subnet_route_nexthop.trim(),
            },
          ];
        }

        if (values.subnet_description?.trim()) {
          subnet.description = values.subnet_description.trim();
        }

        body.subnet = subnet;
      }

      if (
        isCreateTrunk ||
        isUpdateTrunk
      ) {
        const trunk: Record<string, unknown> = {};

        if (values.trunk_name?.trim()) {
          trunk.name = values.trunk_name.trim();
        }

        if (isCreateTrunk) {
          trunk.port_id = values.trunk_port_id?.trim();
        }

        if (values.trunk_description?.trim()) {
          trunk.description = values.trunk_description.trim();
        }

        const trunkTags = csv(values.trunk_tags);
        if (trunkTags.length) {
          trunk.tags = trunkTags;
        }

        if (
          values.trunk_subport_id?.trim() &&
          values.trunk_vlan_id?.trim()
        ) {
          trunk.sub_ports = [
            {
              port_id: values.trunk_subport_id.trim(),
              segmentation_type: "vlan",
              segmentation_id: Number(values.trunk_vlan_id),
            },
          ];
        }

        body.trunk = trunk;
      }

      if (
        isCreateQosPolicy ||
        isUpdateQosPolicy
      ) {
        const policy: Record<string, unknown> = {};

        if (values.qos_name?.trim()) {
          policy.name = values.qos_name.trim();
        }

        if (values.qos_shared) {
          policy.shared = values.qos_shared === "true";
        }

        if (values.qos_description?.trim()) {
          policy.description = values.qos_description.trim();
        }

        const qosTags = csv(values.qos_tags);
        if (qosTags.length) {
          policy.tags = qosTags;
        }

        body.policy = policy;
      }

      if (
        isCreateFirewallGroup ||
        isUpdateFirewallGroup
      ) {
        const firewallGroup: Record<string, unknown> = {};

        if (values.firewall_name?.trim()) {
          firewallGroup.name = values.firewall_name.trim();
        }

        if (values.firewall_ingress_policy_id?.trim()) {
          firewallGroup.ingress_firewall_policy_id =
            values.firewall_ingress_policy_id.trim();
        }

        if (values.firewall_egress_policy_id?.trim()) {
          firewallGroup.egress_firewall_policy_id =
            values.firewall_egress_policy_id.trim();
        }

        try {
          const selectedPorts = JSON.parse(
            values.firewall_ports || "[]",
          );
          if (Array.isArray(selectedPorts) && selectedPorts.length) {
            firewallGroup.ports = selectedPorts;
          }
        } catch {
          // MultiSelectField always writes valid JSON.
        }

        if (values.firewall_admin_state_up) {
          firewallGroup.admin_state_up =
            values.firewall_admin_state_up === "true";
        }

        if (values.firewall_description?.trim()) {
          firewallGroup.description = values.firewall_description.trim();
        }

        const firewallTags = csv(values.firewall_tags);
        if (firewallTags.length) {
          firewallGroup.tags = firewallTags;
        }

        body.firewall_group = firewallGroup;
      }

      if (isUploadObject) {
        body.payload = {
          project_id: cloud.projectId,
          availability_zone: cloud.availabilityZone,
          container_name: values.object_container_name.trim(),
        };
      }

      if (isRouterInterfaceAction) {
        if (values.router_subnet_id?.trim()) {
          query.subnet_id = values.router_subnet_id.trim();
          delete query.port_id;
        } else if (values.router_port_id?.trim()) {
          query.port_id = values.router_port_id.trim();
          delete query.subnet_id;
        }
      }

      if (
        isAttachNetworkInterface
      ) {
        if (
          body.port_id
        ) {
          delete body.net_id;
          delete body.fixed_ip;
        } else if (
          body.net_id
        ) {
          delete body.port_id;
        }
      }

      for (
        const contextField of [
          "project_id",
          "availability_zone",
          "az_name",
        ] as const
      ) {
        const existsInBody =
          fields.some(
            (
              field,
            ) =>
              field.name ===
              contextField,
          );

        if (
          !existsInBody
        ) {
          continue;
        }

        const existing =
          query[
            contextField
          ];

        if (
          existing !==
            undefined &&
          existing !==
            null &&
          existing !==
            ""
        ) {
          continue;
        }

        const value =
          body[
            contextField
          ] ??
          auto(
            contextField,
          );

        if (
          value !==
            undefined &&
          value !==
            null &&
          value !==
            ""
        ) {
          query[
            contextField
          ] = value;
        }
      }

      let response:
        unknown;

      if (
        op.requestContentType ===
        "multipart/form-data"
      ) {
        const formData =
          new FormData();

        for (
          const field of
            fields
        ) {
          if (
            field.schema
              ?.format ===
            "binary"
          ) {
            const file =
              files[
                field.name
              ];

            if (
              file
            ) {
              formData.append(
                field.name,
                file,
              );
            }

            continue;
          }

          if (
            body[
              field.name
            ] ===
            undefined
          ) {
            continue;
          }

          const value =
            body[
              field.name
            ];

          formData.append(
            field.name,

            typeof value ===
              "object"
              ? JSON.stringify(
                  value,
                )
              : String(
                  value,
                ),
          );
        }

        const rawResponse =
          await fetch(
            `/api/proxy${path}${qs(
              query,
            )}`,
            {
              method:
                op.method.toUpperCase(),

              body:
                formData,
            },
          );

        const text =
          await rawResponse.text();

        let data:
          unknown =
          null;

        try {
          data =
            text
              ? JSON.parse(
                  text,
                )
              : null;
        } catch {
          data =
            text;
        }

        if (
          !rawResponse.ok
        ) {
          const message =
            isRecord(
              data,
            ) &&
            typeof data.message ===
              "string"
              ? data.message
              : isRecord(
                    data,
                  ) &&
                  typeof data.detail ===
                    "string"
                ? data.detail
                : `Request failed (${rawResponse.status})`;

          throw Object.assign(
            new Error(
              message,
            ),
            {
              payload:
                data,
            },
          );
        }

        response =
          data;
      } else {
        response =
          await apiRequest(
            `${path}${qs(
              query,
            )}`,
            {
              method:
                op.method.toUpperCase(),

              body:
                fields.length >
                0
                  ? JSON.stringify(
                      body,
                    )
                  : undefined,
            },
          );
      }

      setResult(
        response,
      );

      onSuccess?.(
        response,
      );
    } catch (
      caught:
        unknown
    ) {
      if (
        isRecord(
          caught,
        ) &&
        "payload" in
          caught
      ) {
        setError(
          caught.payload,
        );
      } else {
        setError({
          message:
            caught instanceof
            Error
              ? caught.message
              : "Unexpected error",
        });
      }
    } finally {
      setBusy(
        false,
      );
    }
  }

  return (
    <>
      <div>
        {!compact && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  op.method ===
                  "get"
                    ? "blue"
                    : op.method ===
                        "delete"
                      ? "red"
                      : "green"
                }
              >
                {op.method.toUpperCase()}
              </Badge>

              <code className="text-sm text-slate-600">
                {op.path}
              </code>
            </div>

            <h2 className="mt-3 text-xl font-semibold">
              {op.summary}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {op.tag}
              {" · "}
              Auth:{" "}
              {op.security.join(
                ", ",
              ) ||
                "none documented"}
            </p>
          </>
        )}

        {isCreateInstance && (
          <InfoBox
            title="Launch a virtual machine"
            text="Choose the image, compute size, network, SSH keypair, and security group."
          />
        )}

        {isResizeInstance && (
          <InfoBox
            title="Resize instance"
            text="Choose the new compute flavor for this instance."
          />
        )}

        {isCreateSecurityGroup && (
          <InfoBox
            title="Create security group"
            text="Give the security group a name and optional description and tags. Project and availability zone are filled automatically."
          />
        )}

        {isAttachSecurityGroup && (
          <InfoBox
            title="Attach security group"
            text="Choose the security group to attach to this instance."
          />
        )}

        {isRemoveSecurityGroup && (
          <InfoBox
            title="Remove security group"
            text="Choose one of the security groups currently attached to this instance."
            warning
          />
        )}

        {isAttachNetworkInterface && (
          <InfoBox
            title="Attach network interface"
            text="Choose either a Network or an existing Port. If you choose a Network, you can optionally request a specific fixed IP address."
          />
        )}

        {isDetachNetworkInterface && (
          <InfoBox
            title="Detach network interface"
            text="Choose one of the network interfaces currently attached to this instance."
            warning
          />
        )}

        {isCreateVolume && (
          <InfoBox
            title="Create block storage"
            text="Choose the volume size and type. You can optionally create it from an image, snapshot, or existing volume."
          />
        )}

        {isAttachVolume && (
          <InfoBox
            title="Attach volume to instance"
            text="Choose the virtual machine that should use this volume."
          />
        )}

        {isDetachVolume && (
          <InfoBox
            title="Detach volume"
            text="Choose the instance from which this volume should be detached."
            warning
          />
        )}

        {isCreateBackup && (
          <InfoBox
            title="Create volume backup"
            text="Choose the volume to protect. Incremental backups store only changes since the previous backup when supported. Use Force only when you intentionally need to back up an in-use volume."
          />
        )}

        {isRestoreBackup && (
          <InfoBox
            title="Restore backup"
            text="Choose an existing target volume, or leave Volume empty and provide a Name to restore into a new volume."
            warning
          />
        )}

        {isCreateVolumeTransfer && (
          <InfoBox
            title="Create volume transfer"
            text="Choose the volume whose ownership you want to transfer. Nobus will create a transfer ID and authorization key that the recipient needs to accept the transfer."
          />
        )}

        {isAcceptVolumeTransfer && (
          <InfoBox
            title="Accept volume transfer"
            text="Enter the authorization key supplied with this transfer. The transfer ID is taken automatically from the selected row."
            warning
          />
        )}

        {isCreateConsistencyGroup && (
          <InfoBox
            title="Create consistency group"
            text="Choose the volume types that this consistency group should support. Project and availability zone are filled automatically."
          />
        )}

        {isUpdateConsistencyGroup && (
          <InfoBox
            title="Update consistency group"
            text="Change the name or description, and choose volumes to add or remove from the group."
          />
        )}

        {isCreateConsistencyGroupSnapshot && (
          <InfoBox
            title="Create consistency group snapshot"
            text="Choose the consistency group to snapshot, then optionally provide a name and description."
          />
        )}

        {(isCreateQosPolicy || isUpdateQosPolicy) && (
          <InfoBox
            title={isCreateQosPolicy ? "Create QoS policy" : "Update QoS policy"}
            text="Set the policy name, sharing behavior, description and tags. Project and availability zone are handled automatically."
          />
        )}

        {(isCreateFirewallGroup || isUpdateFirewallGroup) && (
          <InfoBox
            title={isCreateFirewallGroup ? "Create firewall group" : "Update firewall group"}
            text="Choose the ports protected by this firewall group and optionally link ingress or egress firewall policy IDs."
          />
        )}

        {isUploadObject && (
          <InfoBox
            title="Upload object"
            text="Choose the target container and file. Nobus builds the multipart payload and cloud context automatically."
          />
        )}

        {isDeleteInstance && (
          <InfoBox
            title="Delete instance storage"
            text="Review the Delete Attached Root Volume option before confirming. Leave it enabled to remove the instance root volume with the VM, or disable it if you need to preserve that volume."
            warning
          />
        )}

        {destructive && (
          <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />

            This action can affect a running resource.
            You will be asked to confirm before it runs.
          </div>
        )}

        {validationError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {(
          visibleParameters.length >
            0 ||
          visibleFields.length >
            0 ||
          isCreateSecurityGroup ||
          isCreateConsistencyGroup ||
          isUpdateConsistencyGroup ||
          isCreateQosPolicy ||
          isUpdateQosPolicy ||
          isCreateFirewallGroup ||
          isUpdateFirewallGroup ||
          isUploadObject
        ) && (
          <div className="mt-5 space-y-5">
            {visibleParameters.map(
              (
                parameter,
              ) => (
                <Field
                  key={
                    parameter.name
                  }
                  name={
                    parameter.name
                  }
                  schema={
                    parameter.schema ||
                    {}
                  }
                  required={
                    parameter.required
                  }
                  value={
                    params[
                      parameter.name
                    ] ??
                    auto(
                      parameter.name,
                    )
                  }
                  options={smartOptions(
                    parameter.name,
                  )}
                  optionsLoading={optionsLoading(
                    parameter.name,
                  )}
                  optionsError={optionsError(
                    parameter.name,
                  )}
                  set={(
                    value,
                  ) => {
                    setValidationError(
                      null,
                    );

                    setParams(
                      (
                        current,
                      ) => ({
                        ...current,

                        [parameter.name]:
                          value,
                      }),
                    );
                  }}
                />
              ),
            )}

            {isCreateSecurityGroup && (
              <div className="space-y-4">
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Name
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </span>

                  <Input
                    value={
                      values.security_group_name ||
                      ""
                    }
                    onChange={(event) =>
                      setBodyValue(
                        "security_group_name",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. web-servers"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </span>

                  <Textarea
                    value={
                      values.security_group_description ||
                      ""
                    }
                    onChange={(event) =>
                      setBodyValue(
                        "security_group_description",
                        event.target.value,
                      )
                    }
                    placeholder={`Optional — defaults to Security Group for ${cloud.projectId}`}
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tags
                  </span>

                  <Input
                    value={
                      values.security_group_tags ||
                      ""
                    }
                    onChange={(event) =>
                      setBodyValue(
                        "security_group_tags",
                        event.target.value,
                      )
                    }
                    placeholder="production, web, public"
                  />

                  <span className="mt-1.5 block text-xs text-slate-500">
                    Separate multiple tags with commas.
                  </span>
                </label>
              </div>
            )}

            {(isCreateRouter || isUpdateRouter) && (
              <div className="space-y-4">
                <Field
                  name="router_name"
                  schema={{ type: "string" }}
                  required={isCreateRouter}
                  value={values.router_name || ""}
                  set={(value) => setBodyValue("router_name", value)}
                />

                <Field
                  name="router_admin_state_up"
                  schema={{ type: "boolean", default: true }}
                  required={false}
                  value={values.router_admin_state_up || "true"}
                  set={(value) => setBodyValue("router_admin_state_up", value)}
                />

                <Field
                  name="router_external_network_id"
                  schema={{ type: "string", title: "External Network" }}
                  required={false}
                  value={values.router_external_network_id || ""}
                  options={networkOptions}
                  optionsLoading={networksQuery.isLoading}
                  set={(value) => setBodyValue("router_external_network_id", value)}
                />

                <Field
                  name="router_enable_snat"
                  schema={{ type: "boolean", default: true }}
                  required={false}
                  value={values.router_enable_snat || "true"}
                  set={(value) => setBodyValue("router_enable_snat", value)}
                />

                <Field
                  name="router_description"
                  schema={{ type: "string" }}
                  required={false}
                  value={values.router_description || ""}
                  set={(value) => setBodyValue("router_description", value)}
                />

                <Field
                  name="router_tags"
                  schema={{ type: "string", title: "Tags (comma separated)" }}
                  required={false}
                  value={values.router_tags || ""}
                  set={(value) => setBodyValue("router_tags", value)}
                />
              </div>
            )}

            {isRouterInterfaceAction && (
              <div className="space-y-4">
                <Field
                  name="router_subnet_id"
                  schema={{ type: "string", title: "Subnet" }}
                  required={false}
                  value={values.router_subnet_id || ""}
                  options={subnetOptions}
                  optionsLoading={subnetsQuery.isLoading}
                  set={(value) => {
                    setBodyValue("router_subnet_id", value);
                    if (value) setBodyValue("router_port_id", "");
                  }}
                />

                <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">or</div>

                <Field
                  name="router_port_id"
                  schema={{ type: "string", title: "Port" }}
                  required={false}
                  value={values.router_port_id || ""}
                  options={availablePortOptions}
                  optionsLoading={portsQuery.isLoading}
                  set={(value) => {
                    setBodyValue("router_port_id", value);
                    if (value) setBodyValue("router_subnet_id", "");
                  }}
                />
              </div>
            )}

            {(isCreateFloatingIp || isUpdateFloatingIp) && (
              <div className="space-y-4">
                {isCreateFloatingIp && (
                  <Field
                    name="fip_network_id"
                    schema={{ type: "string", title: "External Network" }}
                    required
                    value={values.fip_network_id || ""}
                    options={networkOptions}
                    optionsLoading={networksQuery.isLoading}
                    set={(value) => setBodyValue("fip_network_id", value)}
                  />
                )}

                <Field
                  name="fip_port_id"
                  schema={{ type: "string", title: "Associate with Port" }}
                  required={false}
                  value={values.fip_port_id || ""}
                  options={availablePortOptions}
                  optionsLoading={portsQuery.isLoading}
                  set={(value) => setBodyValue("fip_port_id", value)}
                />

                <Field
                  name="fip_fixed_ip"
                  schema={{ type: "string", title: "Fixed IP Address" }}
                  required={false}
                  value={values.fip_fixed_ip || ""}
                  set={(value) => setBodyValue("fip_fixed_ip", value)}
                />

                <Field
                  name="fip_description"
                  schema={{ type: "string", title: "Description" }}
                  required={false}
                  value={values.fip_description || ""}
                  set={(value) => setBodyValue("fip_description", value)}
                />

                <Field
                  name="fip_tags"
                  schema={{ type: "string", title: "Tags (comma separated)" }}
                  required={false}
                  value={values.fip_tags || ""}
                  set={(value) => setBodyValue("fip_tags", value)}
                />
              </div>
            )}

            {(isCreatePort || isUpdatePort) && (
              <div className="space-y-4">
                {isCreatePort && (
                  <Field
                    name="port_network_id"
                    schema={{ type: "string", title: "Network" }}
                    required
                    value={values.port_network_id || ""}
                    options={networkOptions}
                    optionsLoading={networksQuery.isLoading}
                    set={(value) => setBodyValue("port_network_id", value)}
                  />
                )}

                <Field
                  name="port_name"
                  schema={{ type: "string", title: "Name" }}
                  required={false}
                  value={values.port_name || ""}
                  set={(value) => setBodyValue("port_name", value)}
                />

                <Field
                  name="port_admin_state_up"
                  schema={{ type: "boolean", title: "Admin State Up", default: true }}
                  required={false}
                  value={values.port_admin_state_up || "true"}
                  set={(value) => setBodyValue("port_admin_state_up", value)}
                />

                <MultiSelectField
                  label="Security Groups"
                  options={securityGroupOptions}
                  loading={securityGroupsQuery.isLoading}
                  value={values.port_security_groups || "[]"}
                  onChange={(value) => setBodyValue("port_security_groups", value)}
                  emptyText="No security groups are currently available."
                />

                <Field
                  name="port_security_enabled"
                  schema={{ type: "boolean", title: "Port Security Enabled" }}
                  required={false}
                  value={values.port_security_enabled || "true"}
                  set={(value) => setBodyValue("port_security_enabled", value)}
                />

                <Field
                  name="port_fixed_subnet_id"
                  schema={{ type: "string", title: "Fixed IP Subnet" }}
                  required={false}
                  value={values.port_fixed_subnet_id || ""}
                  options={subnetOptions}
                  optionsLoading={subnetsQuery.isLoading}
                  set={(value) => setBodyValue("port_fixed_subnet_id", value)}
                />

                <Field
                  name="port_fixed_ip"
                  schema={{ type: "string", title: "Fixed IP Address" }}
                  required={false}
                  value={values.port_fixed_ip || ""}
                  set={(value) => setBodyValue("port_fixed_ip", value)}
                />

                <Field
                  name="port_allowed_ip"
                  schema={{ type: "string", title: "Allowed Address Pair IP" }}
                  required={false}
                  value={values.port_allowed_ip || ""}
                  set={(value) => setBodyValue("port_allowed_ip", value)}
                />

                <Field
                  name="port_allowed_mac"
                  schema={{ type: "string", title: "Allowed Address Pair MAC" }}
                  required={false}
                  value={values.port_allowed_mac || ""}
                  set={(value) => setBodyValue("port_allowed_mac", value)}
                />

                <Field
                  name="port_vnic_type"
                  schema={{ type: "string", title: "VNIC Type", enum: ["normal", "direct", "macvtap", "smart-nic"] }}
                  required={false}
                  value={values.port_vnic_type || "normal"}
                  set={(value) => setBodyValue("port_vnic_type", value)}
                />

                <Field
                  name="port_dns_name"
                  schema={{ type: "string", title: "DNS Name" }}
                  required={false}
                  value={values.port_dns_name || ""}
                  set={(value) => setBodyValue("port_dns_name", value)}
                />

                <Field
                  name="port_description"
                  schema={{ type: "string", title: "Description" }}
                  required={false}
                  value={values.port_description || ""}
                  set={(value) => setBodyValue("port_description", value)}
                />

                <Field
                  name="port_tags"
                  schema={{ type: "string", title: "Tags (comma separated)" }}
                  required={false}
                  value={values.port_tags || ""}
                  set={(value) => setBodyValue("port_tags", value)}
                />
              </div>
            )}

            {isSetPortAddressPairs && (
              <div className="space-y-4">
                <Field
                  name="address_pair_ip"
                  schema={{ type: "string", title: "IP Address" }}
                  required
                  value={values.address_pair_ip || ""}
                  set={(value) => setBodyValue("address_pair_ip", value)}
                />

                <Field
                  name="address_pair_mac"
                  schema={{ type: "string", title: "MAC Address" }}
                  required={false}
                  value={values.address_pair_mac || ""}
                  set={(value) => setBodyValue("address_pair_mac", value)}
                />
              </div>
            )}

            {(isCreateSubnet || isUpdateSubnet) && (
              <div className="space-y-4">
                {isCreateSubnet && (
                  <>
                    <Field
                      name="subnet_network_id"
                      schema={{ type: "string", title: "Network" }}
                      required
                      value={values.subnet_network_id || ""}
                      options={networkOptions}
                      optionsLoading={networksQuery.isLoading}
                      set={(value) => setBodyValue("subnet_network_id", value)}
                    />

                    <Field
                      name="subnet_cidr"
                      schema={{ type: "string", title: "CIDR" }}
                      required
                      value={values.subnet_cidr || ""}
                      set={(value) => setBodyValue("subnet_cidr", value)}
                    />

                    <Field
                      name="subnet_ip_version"
                      schema={{ type: "integer", title: "IP Version", enum: [4, 6] }}
                      required
                      value={values.subnet_ip_version || "4"}
                      set={(value) => setBodyValue("subnet_ip_version", value)}
                    />
                  </>
                )}

                <Field
                  name="subnet_name"
                  schema={{ type: "string", title: "Name" }}
                  required={false}
                  value={values.subnet_name || ""}
                  set={(value) => setBodyValue("subnet_name", value)}
                />

                <Field
                  name="subnet_enable_dhcp"
                  schema={{ type: "boolean", title: "Enable DHCP", default: true }}
                  required={false}
                  value={values.subnet_enable_dhcp || "true"}
                  set={(value) => setBodyValue("subnet_enable_dhcp", value)}
                />

                <Field
                  name="subnet_gateway_ip"
                  schema={{ type: "string", title: "Gateway IP" }}
                  required={false}
                  value={values.subnet_gateway_ip || ""}
                  set={(value) => setBodyValue("subnet_gateway_ip", value)}
                />

                <Field
                  name="subnet_dns"
                  schema={{ type: "string", title: "DNS Nameservers (comma separated)" }}
                  required={false}
                  value={values.subnet_dns || ""}
                  set={(value) => setBodyValue("subnet_dns", value)}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    name="subnet_pool_start"
                    schema={{ type: "string", title: "Allocation Pool Start" }}
                    required={false}
                    value={values.subnet_pool_start || ""}
                    set={(value) => setBodyValue("subnet_pool_start", value)}
                  />
                  <Field
                    name="subnet_pool_end"
                    schema={{ type: "string", title: "Allocation Pool End" }}
                    required={false}
                    value={values.subnet_pool_end || ""}
                    set={(value) => setBodyValue("subnet_pool_end", value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    name="subnet_route_destination"
                    schema={{ type: "string", title: "Route Destination" }}
                    required={false}
                    value={values.subnet_route_destination || ""}
                    set={(value) => setBodyValue("subnet_route_destination", value)}
                  />
                  <Field
                    name="subnet_route_nexthop"
                    schema={{ type: "string", title: "Route Next Hop" }}
                    required={false}
                    value={values.subnet_route_nexthop || ""}
                    set={(value) => setBodyValue("subnet_route_nexthop", value)}
                  />
                </div>

                <Field
                  name="subnet_description"
                  schema={{ type: "string", title: "Description" }}
                  required={false}
                  value={values.subnet_description || ""}
                  set={(value) => setBodyValue("subnet_description", value)}
                />
              </div>
            )}

            {(isCreateTrunk || isUpdateTrunk) && (
              <div className="space-y-4">
                <Field
                  name="trunk_name"
                  schema={{ type: "string", title: "Name" }}
                  required={isCreateTrunk}
                  value={values.trunk_name || ""}
                  set={(value) => setBodyValue("trunk_name", value)}
                />

                {isCreateTrunk && (
                  <Field
                    name="trunk_port_id"
                    schema={{ type: "string", title: "Parent Port" }}
                    required
                    value={values.trunk_port_id || ""}
                    options={availablePortOptions}
                    optionsLoading={portsQuery.isLoading}
                    set={(value) => setBodyValue("trunk_port_id", value)}
                  />
                )}

                <Field
                  name="trunk_subport_id"
                  schema={{ type: "string", title: "Subport" }}
                  required={false}
                  value={values.trunk_subport_id || ""}
                  options={availablePortOptions}
                  optionsLoading={portsQuery.isLoading}
                  set={(value) => setBodyValue("trunk_subport_id", value)}
                />

                <Field
                  name="trunk_vlan_id"
                  schema={{ type: "integer", title: "VLAN ID", minimum: 1, maximum: 4094 }}
                  required={false}
                  value={values.trunk_vlan_id || ""}
                  set={(value) => setBodyValue("trunk_vlan_id", value)}
                />

                <Field
                  name="trunk_description"
                  schema={{ type: "string", title: "Description" }}
                  required={false}
                  value={values.trunk_description || ""}
                  set={(value) => setBodyValue("trunk_description", value)}
                />

                <Field
                  name="trunk_tags"
                  schema={{ type: "string", title: "Tags (comma separated)" }}
                  required={false}
                  value={values.trunk_tags || ""}
                  set={(value) => setBodyValue("trunk_tags", value)}
                />
              </div>
            )}

            {(isCreateQosPolicy || isUpdateQosPolicy) && (
              <div className="space-y-4">
                <Field name="qos_name" schema={{ type: "string", title: "Name" }} required={isCreateQosPolicy} value={values.qos_name || ""} set={(value) => setBodyValue("qos_name", value)} />
                <Field name="qos_shared" schema={{ type: "boolean", title: "Shared", default: false }} required={false} value={values.qos_shared || "false"} set={(value) => setBodyValue("qos_shared", value)} />
                <Field name="qos_description" schema={{ type: "string", title: "Description" }} required={false} value={values.qos_description || ""} set={(value) => setBodyValue("qos_description", value)} />
                <Field name="qos_tags" schema={{ type: "string", title: "Tags (comma separated)" }} required={false} value={values.qos_tags || ""} set={(value) => setBodyValue("qos_tags", value)} />
              </div>
            )}

            {(isCreateFirewallGroup || isUpdateFirewallGroup) && (
              <div className="space-y-4">
                <Field name="firewall_name" schema={{ type: "string", title: "Name" }} required={isCreateFirewallGroup} value={values.firewall_name || ""} set={(value) => setBodyValue("firewall_name", value)} />
                <MultiSelectField label="Ports" options={availablePortOptions} loading={portsQuery.isLoading} value={values.firewall_ports || "[]"} onChange={(value) => setBodyValue("firewall_ports", value)} emptyText="No ports are currently available." />
                <Field name="firewall_ingress_policy_id" schema={{ type: "string", title: "Ingress Firewall Policy ID" }} required={false} value={values.firewall_ingress_policy_id || ""} set={(value) => setBodyValue("firewall_ingress_policy_id", value)} />
                <Field name="firewall_egress_policy_id" schema={{ type: "string", title: "Egress Firewall Policy ID" }} required={false} value={values.firewall_egress_policy_id || ""} set={(value) => setBodyValue("firewall_egress_policy_id", value)} />
                <Field name="firewall_admin_state_up" schema={{ type: "boolean", title: "Admin State Up", default: true }} required={false} value={values.firewall_admin_state_up || "true"} set={(value) => setBodyValue("firewall_admin_state_up", value)} />
                <Field name="firewall_description" schema={{ type: "string", title: "Description" }} required={false} value={values.firewall_description || ""} set={(value) => setBodyValue("firewall_description", value)} />
                <Field name="firewall_tags" schema={{ type: "string", title: "Tags (comma separated)" }} required={false} value={values.firewall_tags || ""} set={(value) => setBodyValue("firewall_tags", value)} />
              </div>
            )}

            {isUploadObject && (
              <div className="space-y-4">
                <Field name="object_container_name" schema={{ type: "string", title: "Container" }} required value={values.object_container_name || rawString(initialValues.container_name) || rawString(initialValues.name) || ""} set={(value) => setBodyValue("object_container_name", value)} />
                <Field name="file_data" schema={{ type: "string", format: "binary", title: "File" }} required value="" set={() => {}} setFile={(file) => { setValidationError(null); setFiles((current) => ({ ...current, file_data: file })); }} />
              </div>
            )}

            {isCreateConsistencyGroup && (
              <MultiSelectField
                label="Volume Types"
                options={volumeTypeIdOptions}
                loading={volumeTypesQuery.isLoading}
                value={values.volume_types || "[]"}
                onChange={(value) =>
                  setBodyValue(
                    "volume_types",
                    value,
                  )
                }
                emptyText="No volume types are currently available."
              />
            )}

            {isUpdateConsistencyGroup && (
              <>
                <MultiSelectField
                  label="Add Volumes"
                  options={volumeOptions}
                  loading={volumesQuery.isLoading}
                  value={values.add_volumes || "[]"}
                  onChange={(value) =>
                    setBodyValue(
                      "add_volumes",
                      value,
                    )
                  }
                  emptyText="No volumes are currently available to add."
                />

                <MultiSelectField
                  label="Remove Volumes"
                  options={volumeOptions}
                  loading={volumesQuery.isLoading}
                  value={values.remove_volumes || "[]"}
                  onChange={(value) =>
                    setBodyValue(
                      "remove_volumes",
                      value,
                    )
                  }
                  emptyText="No volumes are currently available to remove."
                />
              </>
            )}

            {visibleFields.map(
              (
                field,
              ) => (
                <Field
                  key={
                    field.name
                  }
                  name={
                    field.name
                  }
                  schema={
                    field.schema
                  }
                  required={
                    field.required
                  }
                  value={
                    values[
                      field.name
                    ] ??
                    auto(
                      field.name,
                    )
                  }
                  options={smartOptions(
                    field.name,
                  )}
                  optionsLoading={optionsLoading(
                    field.name,
                  )}
                  optionsError={optionsError(
                    field.name,
                  )}
                  securityGroupOptions={
                    field.name ===
                      "security_groups"
                      ? securityGroupOptions
                      : undefined
                  }
                  set={(
                    value,
                  ) =>
                    setBodyValue(
                      field.name,
                      value,
                    )
                  }
                  setFile={(
                    file,
                  ) =>
                    setFiles(
                      (
                        current,
                      ) => ({
                        ...current,

                        [field.name]:
                          file,
                      }),
                    )
                  }
                />
              ),
            )}
          </div>
        )}

        <Button
          className="mt-6 w-full sm:w-auto"
          variant={
            destructive
              ? "danger"
              : "primary"
          }
          disabled={
            busy
          }
          onClick={
            requestRun
          }
        >
          <Play className="h-4 w-4" />

          {busy
            ? "Running…"
            : isCreateSecurityGroup
              ? "Create Security Group"
              : isCreateInstance
                ? "Launch Instance"
              : isResizeInstance
                ? "Resize Instance"
                : isAttachSecurityGroup
                  ? "Attach Security Group"
                  : isRemoveSecurityGroup
                    ? "Remove Security Group"
                    : isAttachNetworkInterface
                      ? "Attach Interface"
                      : isDetachNetworkInterface
                        ? "Detach Interface"
                        : isCreateVolume
                          ? "Create Volume"
                          : isAttachVolume
                            ? "Attach Volume"
                            : isDetachVolume
                              ? "Detach Volume"
                              : isCreateBackup
                                ? "Create Backup"
                                : isRestoreBackup
                                  ? "Restore Backup"
                                  : isCreateVolumeTransfer
                                    ? "Create Transfer"
                                    : isAcceptVolumeTransfer
                                      ? "Accept Transfer"
                                      : isCreateRouter
                                        ? "Create Router"
                                        : isUpdateRouter
                                          ? "Update Router"
                                          : isAddRouterInterface
                                            ? "Add Interface"
                                            : isRemoveRouterInterface
                                              ? "Remove Interface"
                                              : isCreateFloatingIp
                                                ? "Allocate Floating IP"
                                                : isUpdateFloatingIp
                                                  ? "Update Floating IP"
                                                  : isCreatePort
                                                    ? "Create Port"
                                                    : isUpdatePort
                                                      ? "Update Port"
                                                      : isSetPortAddressPairs
                                                        ? "Set Address Pair"
                                                        : isCreateSubnet
                                                          ? "Create Subnet"
                                                          : isUpdateSubnet
                                                            ? "Update Subnet"
                                                            : isCreateTrunk
                                                              ? "Create Trunk"
                                                              : isUpdateTrunk
                                                                ? "Update Trunk"
                                                                : isCreateQosPolicy
                                                                  ? "Create QoS Policy"
                                                                  : isUpdateQosPolicy
                                                                    ? "Update QoS Policy"
                                                                    : isCreateFirewallGroup
                                                                      ? "Create Firewall Group"
                                                                      : isUpdateFirewallGroup
                                                                        ? "Update Firewall Group"
                                                                        : isUploadObject
                                                                          ? "Upload Object"
                                                                          : isCreateConsistencyGroup
                                        ? "Create Consistency Group"
                                        : isUpdateConsistencyGroup
                                          ? "Update Consistency Group"
                                          : isCreateConsistencyGroupSnapshot
                                            ? "Create Group Snapshot"
                                            : submitLabel ||
                                op.summary.replace(
                                  / Api$/i,
                                  "",
                                )}
        </Button>

        {(
          result !==
            null ||
          error !==
            null
        ) && (
          <section className="mt-5">
            <div
              className={`rounded-lg border p-4 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <div className="font-semibold">
                {error
                  ? "Action failed"
                  : "Action completed"}
              </div>

              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(
                  error ??
                    result,
                  null,
                  2,
                )}
              </pre>
            </div>
          </section>
        )}
      </div>

      {confirmOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-slate-950/40 backdrop-blur-[1px]"
            onClick={() =>
              setConfirmOpen(
                false,
              )
            }
          />

          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 p-5">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-slate-950">
                    Confirm action
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmOpen(
                      false,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <p className="text-sm leading-6 text-slate-600">
                  You are about to run{" "}
                  <span className="font-semibold text-slate-900">
                    {op.summary.replace(
                      / Api$/i,
                      "",
                    )}
                  </span>
                  . This may interrupt, detach, remove,
                  shut down, or permanently change the
                  selected resource.
                  {isDeleteInstance && (
                    <>
                      {" "}
                      The attached root volume will
                      <span className="font-semibold text-slate-900">
                        {String(
                          params.delete_volume ??
                            auto("delete_volume") ??
                            "true",
                        ) === "false"
                          ? " be preserved"
                          : " also be deleted"}
                      </span>
                      .
                    </>
                  )}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmOpen(
                        false,
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      void run()
                    }
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MultiSelectField({
  label,
  options,
  loading,
  value,
  onChange,
  emptyText,
}: {
  label: string;
  options: SmartOption[];
  loading?: boolean;
  value: string;
  onChange: (value: string) => void;
  emptyText: string;
}) {
  let selected: string[] = [];

  try {
    const parsed = JSON.parse(
      value || "[]",
    );

    if (Array.isArray(parsed)) {
      selected = parsed.map((item) =>
        String(item),
      );
    }
  } catch {
    selected = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function toggle(
    optionValue: string,
  ) {
    const next = selected.includes(
      optionValue,
    )
      ? selected.filter(
          (item) =>
            item !== optionValue,
        )
      : [
          ...selected,
          optionValue,
        ];

    onChange(
      JSON.stringify(next),
    );
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        {loading ? (
          <div className="text-sm text-slate-500">
            Loading…
          </div>
        ) : options.length === 0 ? (
          <div className="text-sm text-amber-600">
            {emptyText}
          </div>
        ) : (
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {options.map((option) => {
              const checked = selected.includes(
                option.value,
              );

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    checked={checked}
                    onChange={() =>
                      toggle(
                        option.value,
                      )
                    }
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">
                      {option.label}
                    </span>

                    {option.description && (
                      <span className="mt-0.5 block break-all text-xs text-slate-500">
                        {option.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <span className="mt-1.5 block text-xs text-slate-500">
          {selected.length} selected
        </span>
      )}
    </div>
  );
}

function InfoBox({
  title,
  text,
  warning = false,
}: {
  title: string;
  text: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`mb-5 mt-1 rounded-xl border p-4 ${
        warning
          ? "border-amber-100 bg-amber-50/70"
          : "border-blue-100 bg-blue-50/60"
      }`}
    >
      <div className="text-sm font-semibold text-slate-900">
        {title}
      </div>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function Field({
  name,
  schema,
  required,
  value,
  set,
  setFile,
  options,
  optionsLoading = false,
  optionsError = "",
  securityGroupOptions,
}: {
  name: string;
  schema: Schema;
  required?: boolean;
  value: string;
  set: (
    value: string,
  ) => void;
  setFile?: (
    value: File,
  ) => void;
  options?: SmartOption[];
  optionsLoading?: boolean;
  optionsError?: string;
  securityGroupOptions?: SmartOption[];
}) {
  const type =
    primitiveType(
      schema,
    );

  const label = (
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {fieldLabel(
        name,
      )}

      {required && (
        <span className="text-red-500">
          {" "}
          *
        </span>
      )}
    </span>
  );

  if (
    schema?.format ===
    "binary"
  ) {
    return (
      <label>
        {label}

        <Input
          type="file"
          onChange={(
            event,
          ) => {
            const file =
              event.target
                .files?.[0];

            if (
              file &&
              setFile
            ) {
              setFile(
                file,
              );
            }
          }}
        />
      </label>
    );
  }

  if (
    options
  ) {
    return (
      <label>
        {label}

        <Select
          value={
            value
          }
          disabled={
            optionsLoading
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
        >
          <option value="">
            {optionsLoading
              ? "Loading…"
              : name ===
                    "network_id" ||
                  name ===
                    "net_id"
                ? "Select network…"
                : name ===
                    "port_id"
                  ? "Select port…"
                  : name ===
                      "volume_type"
                    ? "Default volume type"
                    : name ===
                        "image_ref"
                      ? "Blank volume"
                      : name ===
                          "server_id"
                        ? "Select instance…"
                        : name ===
                            "flavor_id"
                          ? "Select new flavor…"
                          : name ===
                              "security_group_name"
                            ? "Select security group…"
                            : name ===
                                "key_name"
                              ? "Select SSH keypair…"
                              : `Select ${fieldLabel(
                                  name,
                                ).toLowerCase()}…`}
          </option>

          {options.map(
            (
              option,
              index,
            ) => (
              <option
                key={`${option.value}-${index}`}
                value={
                  option.value
                }
              >
                {option.label}

                {option.description
                  ? ` — ${option.description}`
                  : ""}
              </option>
            ),
          )}
        </Select>

        {optionsError ? (
          <span className="mt-1.5 block text-xs text-red-600">
            {optionsError}
          </span>
        ) : (
          !optionsLoading &&
          options.length ===
            0 && (
            <span className="mt-1.5 block text-xs text-amber-600">
              No available{" "}
              {fieldLabel(
                name,
              ).toLowerCase()}{" "}
              found.
            </span>
          )
        )}
      </label>
    );
  }

  if (
    name ===
      "security_groups" &&
    securityGroupOptions
  ) {
    let selected =
      "";

    try {
      const parsed =
        JSON.parse(
          value ||
            "[]",
        );

      if (
        Array.isArray(
          parsed,
        ) &&
        parsed.length >
          0
      ) {
        selected =
          String(
            parsed[0],
          );
      }
    } catch {
      selected =
        value;
    }

    return (
      <label>
        {label}

        <Select
          value={
            selected
          }
          onChange={(
            event,
          ) => {
            const selectedName =
              event.target
                .value;

            set(
              JSON.stringify(
                selectedName
                  ? [
                      selectedName,
                    ]
                  : [],
              ),
            );
          }}
        >
          <option value="">
            No security group
          </option>

          {securityGroupOptions.map(
            (
              option,
              index,
            ) => (
              <option
                key={`${option.value}-${index}`}
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            ),
          )}
        </Select>
      </label>
    );
  }

  if (
    schema.enum
      ?.length
  ) {
    return (
      <label>
        {label}

        <Select
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
        >
          <option value="">
            Select…
          </option>

          {schema.enum.map(
            (
              option,
              index,
            ) => (
              <option
                key={`${String(
                  option,
                )}-${index}`}
                value={String(
                  option,
                )}
              >
                {String(
                  option,
                )}
              </option>
            ),
          )}
        </Select>
      </label>
    );
  }

  if (
    type ===
    "boolean"
  ) {
    return (
      <label>
        {label}

        <Select
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
        >
          <option value="">
            Select…
          </option>

          <option value="true">
            Yes
          </option>

          <option value="false">
            No
          </option>
        </Select>
      </label>
    );
  }

  if (
    name ===
    "userdata"
  ) {
    return (
      <label>
        {label}

        <Textarea
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
          placeholder={`#cloud-config
packages:
  - nginx`}
        />
      </label>
    );
  }

  if (
    name ===
    "metadata"
  ) {
    return (
      <label>
        {label}

        <Textarea
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
          placeholder='{"environment":"production"}'
        />
      </label>
    );
  }

  if (
    name ===
    "tags"
  ) {
    return (
      <label>
        {label}

        <Textarea
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
          placeholder='["production","web"]'
        />

        <span className="mt-1.5 block text-xs text-slate-500">
          Enter tags as a JSON array of strings.
        </span>
      </label>
    );
  }

  if (
    type ===
      "array" ||
    type ===
      "object"
  ) {
    return (
      <label>
        {label}

        <Textarea
          value={
            value
          }
          onChange={(
            event,
          ) =>
            set(
              event.target
                .value,
            )
          }
          placeholder={
            type ===
            "array"
              ? "[]"
              : "{}"
          }
        />
      </label>
    );
  }

  return (
    <label>
      {label}

      <Input
        type={
          /password|secret|admin_pass|new_password/i.test(
            name,
          )
            ? "password"
            : type ===
                  "integer" ||
                type ===
                  "number"
              ? "number"
              : "text"
        }
        min={
          name ===
              "size" ||
          name ===
              "volume_size" ||
          name ===
              "new_size" ||
          name ===
              "length"
            ? 1
            : undefined
        }
        value={
          value
        }
        onChange={(
          event,
        ) =>
          set(
            event.target
              .value,
          )
        }
        placeholder={
          name ===
          "fixed_ip"
            ? "Optional, e.g. 10.0.0.25"
            : name ===
                "name"
              ? "Enter a name"
              : name ===
                  "image_name"
                ? "Enter image name"
                : name ===
                    "reboot_type"
                  ? "Enter backend-supported reboot type"
                  : name ===
                      "console_type"
                    ? "Enter backend-supported console type"
                    : name ===
                        "snapshot_id"
                      ? "Optional snapshot ID"
                      : name ===
                          "source_volid"
                        ? "Optional source volume ID"
                        : schema.default !==
                            undefined
                          ? String(
                              schema.default,
                            )
                          : undefined
        }
      />

      {schema.description && (
        <span className="mt-1 block text-xs text-slate-500">
          {
            schema.description
          }
        </span>
      )}
    </label>
  );
}