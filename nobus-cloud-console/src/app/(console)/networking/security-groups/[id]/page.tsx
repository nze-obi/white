"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
  findArray,
  safeString,
} from "@/lib/utils";

import {
  useCloudContext,
} from "@/components/cloud-context";

import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";

type Rule = Record<
  string,
  unknown
>;

type SecurityGroup =
  Record<
    string,
    unknown
  >;

type RuleForm = {
  direction:
    | "ingress"
    | "egress";

  ethertype:
    | "IPv4"
    | "IPv6";

  protocol: string;

  portRangeMin: string;

  portRangeMax: string;

  remoteIpPrefix: string;

  remoteGroupId: string;

  description: string;
};

const emptyForm:
  RuleForm = {
  direction: "ingress",
  ethertype: "IPv4",
  protocol: "",
  portRangeMin: "",
  portRangeMax: "",
  remoteIpPrefix: "",
  remoteGroupId: "",
  description: "",
};

function findSecurityGroup(
  value: unknown,
): SecurityGroup | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.security_group &&
    typeof record.security_group ===
      "object"
  ) {
    return record.security_group as SecurityGroup;
  }

  if (
    record.data &&
    typeof record.data ===
      "object"
  ) {
    const data =
      record.data as Record<
        string,
        unknown
      >;

    if (
      data.security_group &&
      typeof data.security_group ===
        "object"
    ) {
      return data.security_group as SecurityGroup;
    }

    return findSecurityGroup(
      record.data,
    );
  }

  if (
    "id" in record &&
    (
      "name" in record ||
      "description" in
        record
    )
  ) {
    return record;
  }

  return null;
}

function displayProtocol(
  rule: Rule,
) {
  const protocol =
    safeString(
      rule.protocol,
    );

  if (!protocol) {
    return "Any";
  }

  return protocol.toUpperCase();
}

function displayPorts(
  rule: Rule,
) {
  const min =
    rule.port_range_min;

  const max =
    rule.port_range_max;

  if (
    min === undefined ||
    min === null ||
    min === ""
  ) {
    return "Any";
  }

  if (
    max === undefined ||
    max === null ||
    max === "" ||
    String(min) ===
      String(max)
  ) {
    return String(min);
  }

  return `${min} – ${max}`;
}

function displaySource(
  rule: Rule,
) {
  const remoteIp =
    safeString(
      rule.remote_ip_prefix,
    );

  const remoteGroup =
    safeString(
      rule.remote_group_id,
    );

  if (remoteIp) {
    return remoteIp;
  }

  if (remoteGroup) {
    return `Security group: ${remoteGroup}`;
  }

  return "Anywhere";
}

function DirectionBadge({
  value,
}: {
  value: unknown;
}) {
  const direction =
    safeString(value)
      .toLowerCase();

  const ingress =
    direction ===
    "ingress";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        ingress
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-violet-200 bg-violet-50 text-violet-700"
      }`}
    >
      {direction
        ? direction
            .charAt(0)
            .toUpperCase() +
          direction.slice(1)
        : "—"}
    </span>
  );
}

export default function SecurityGroupDetailsPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const securityGroupId =
    decodeURIComponent(
      params.id,
    );

  const cloud =
    useCloudContext();

  const [
    addRuleOpen,
    setAddRuleOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<RuleForm>(
    emptyForm,
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState<
    string | null
  >(null);

  const [
    deleteRule,
    setDeleteRule,
  ] = useState<
    Rule | null
  >(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const ready =
    Boolean(
      cloud.projectId &&
        cloud.availabilityZone &&
        securityGroupId,
    );

  const groupQuery =
    useQuery({
      queryKey: [
        "security-group",
        securityGroupId,
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled: ready,

      queryFn: () =>
        apiRequest(
          `/api/v3/network/security-group${qs(
            {
              security_group_id:
                securityGroupId,

              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,
            },
          )}`,
        ),
    });

  const rulesQuery =
    useQuery({
      queryKey: [
        "security-group-rules",
        securityGroupId,
        cloud.projectId,
        cloud.availabilityZone,
      ],

      enabled: ready,

      queryFn: () =>
        apiRequest(
          `/api/v3/network/security-group-rule/list${qs(
            {
              project_id:
                cloud.projectId,

              availability_zone:
                cloud.availabilityZone,

              security_group_id:
                securityGroupId,
            },
          )}`,
        ),
    });

  const securityGroup =
    useMemo(
      () =>
        findSecurityGroup(
          groupQuery.data,
        ),
      [groupQuery.data],
    );

  const rules =
    useMemo(
      () =>
        findArray(
          rulesQuery.data,
        ),
      [rulesQuery.data],
    );

  function resetForm() {
    setForm(
      emptyForm,
    );

    setFormError(null);
  }

  function closeCreateDrawer() {
    setAddRuleOpen(
      false,
    );

    resetForm();
  }

  async function createRule() {
    setFormError(null);

    if (
      !cloud.projectId ||
      !cloud.availabilityZone
    ) {
      setFormError(
        "Select a project and availability zone first.",
      );

      return;
    }

    if (
      form.portRangeMin &&
      form.portRangeMax &&
      Number(
        form.portRangeMin,
      ) >
        Number(
          form.portRangeMax,
        )
    ) {
      setFormError(
        "The minimum port cannot be greater than the maximum port.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const securityGroupRule:
        Record<
          string,
          unknown
        > = {
        security_group_id:
          securityGroupId,

        direction:
          form.direction,

        ethertype:
          form.ethertype,
      };

      if (
        form.protocol
      ) {
        securityGroupRule.protocol =
          form.protocol;
      }

      if (
        form.portRangeMin
      ) {
        securityGroupRule.port_range_min =
          Number(
            form.portRangeMin,
          );
      }

      if (
        form.portRangeMax
      ) {
        securityGroupRule.port_range_max =
          Number(
            form.portRangeMax,
          );
      }

      if (
        form.remoteIpPrefix.trim()
      ) {
        securityGroupRule.remote_ip_prefix =
          form.remoteIpPrefix.trim();
      }

      if (
        form.remoteGroupId.trim()
      ) {
        securityGroupRule.remote_group_id =
          form.remoteGroupId.trim();
      }

      if (
        form.description.trim()
      ) {
        securityGroupRule.description =
          form.description.trim();
      }

      await apiRequest(
        "/api/v3/network/security-group-rule",
        {
          method: "POST",

          body:
            JSON.stringify(
              {
                project_id:
                  cloud.projectId,

                availability_zone:
                  cloud.availabilityZone,

                security_group_rule:
                  securityGroupRule,
              },
            ),
        },
      );

      await rulesQuery.refetch();

      closeCreateDrawer();
    } catch (
      error: unknown
    ) {
      setFormError(
        error instanceof
          Error
          ? error.message
          : "Could not create the security group rule.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteRule() {
    if (
      !deleteRule ||
      !cloud.projectId ||
      !cloud.availabilityZone
    ) {
      return;
    }

    const ruleId =
      safeString(
        deleteRule.id,
      );

    if (!ruleId) {
      return;
    }

    setDeleting(true);

    try {
      await apiRequest(
        `/api/v3/network/security-group-rule${qs(
          {
            security_group_rule_id:
              ruleId,

            project_id:
              cloud.projectId,

            availability_zone:
              cloud.availabilityZone,
          },
        )}`,
        {
          method: "DELETE",
        },
      );

      setDeleteRule(null);

      await rulesQuery.refetch();
    } finally {
      setDeleting(false);
    }
  }

  const groupName =
    safeString(
      securityGroup?.name,
    ) ||
    "Security Group";

  return (
    <>
      <div className="mb-5">
        <Link
          href="/networking/security-groups"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />

          Security Groups
        </Link>
      </div>

      <PageHeader
        title={groupName}
        description={
          safeString(
            securityGroup?.description,
          ) ||
          "Manage this security group and its firewall rules."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                groupQuery.refetch();
                rulesQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />

              Refresh
            </Button>

            <Button
              onClick={() =>
                setAddRuleOpen(
                  true,
                )
              }
            >
              <Plus className="h-4 w-4" />

              Add Rule
            </Button>
          </div>
        }
      />

      {!ready && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Select a Project ID
          and Availability Zone
          to manage this security
          group.
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Security Group
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                {groupName}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Rules
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {
              rules.length
            }
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ID
          </div>

          <div
            className="mt-2 truncate font-mono text-xs text-slate-600"
            title={
              securityGroupId
            }
          >
            {securityGroupId}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Rules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Control inbound and
              outbound traffic for
              resources using this
              security group.
            </p>
          </div>

          <Button
            onClick={() =>
              setAddRuleOpen(
                true,
              )
            }
          >
            <Plus className="h-4 w-4" />

            Add Rule
          </Button>
        </div>

        {rulesQuery.isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex gap-6"
                >
                  {Array.from({
                    length: 6,
                  }).map(
                    (
                      __,
                      column,
                    ) => (
                      <div
                        key={
                          column
                        }
                        className="h-4 flex-1 animate-pulse rounded bg-slate-100"
                      />
                    ),
                  )}
                </div>
              ),
            )}
          </div>
        ) : rulesQuery.isError ? (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load
              security group rules.
            </div>
          </div>
        ) : rules.length ===
          0 ? (
          <div className="px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />

            <div className="mt-4 font-semibold text-slate-900">
              No rules yet
            </div>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add an ingress or
              egress rule to control
              traffic for resources
              attached to this
              security group.
            </p>

            <Button
              className="mt-5"
              onClick={() =>
                setAddRuleOpen(
                  true,
                )
              }
            >
              <Plus className="h-4 w-4" />

              Add Rule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Direction
                  </th>

                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    IP Version
                  </th>

                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Protocol
                  </th>

                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ports
                  </th>

                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source / Destination
                  </th>

                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="w-20 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {rules.map(
                  (
                    rule,
                    index,
                  ) => (
                    <tr
                      key={String(
                        rule.id ??
                          index,
                      )}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <DirectionBadge
                          value={
                            rule.direction
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {safeString(
                          rule.ethertype,
                        ) ||
                          "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {displayProtocol(
                          rule,
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {displayPorts(
                          rule,
                        )}
                      </td>

                      <td className="max-w-[260px] px-5 py-4 text-slate-700">
                        <div className="truncate">
                          {displaySource(
                            rule,
                          )}
                        </div>
                      </td>

                      <td className="max-w-[260px] px-5 py-4 text-slate-500">
                        <div className="truncate">
                          {safeString(
                            rule.description,
                          ) ||
                            "—"}
                        </div>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          title="Delete rule"
                          onClick={() =>
                            setDeleteRule(
                              rule,
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {addRuleOpen && (
        <>
          <button
            aria-label="Close add rule panel"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={
              closeCreateDrawer
            }
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Security Group
                </div>

                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Add Rule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {groupName}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateDrawer
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Direction
                  </span>

                  <Select
                    value={
                      form.direction
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          direction:
                            event
                              .target
                              .value as
                              | "ingress"
                              | "egress",
                        }),
                      )
                    }
                  >
                    <option value="ingress">
                      Ingress
                    </option>

                    <option value="egress">
                      Egress
                    </option>
                  </Select>
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    IP Version
                  </span>

                  <Select
                    value={
                      form.ethertype
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          ethertype:
                            event
                              .target
                              .value as
                              | "IPv4"
                              | "IPv6",
                        }),
                      )
                    }
                  >
                    <option value="IPv4">
                      IPv4
                    </option>

                    <option value="IPv6">
                      IPv6
                    </option>
                  </Select>
                </label>
              </div>

              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Protocol
                </span>

                <Select
                  value={
                    form.protocol
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        protocol:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                >
                  <option value="">
                    Any protocol
                  </option>

                  <option value="tcp">
                    TCP
                  </option>

                  <option value="udp">
                    UDP
                  </option>

                  <option value="icmp">
                    ICMP
                  </option>

                  <option value="icmpv6">
                    ICMPv6
                  </option>
                </Select>
              </label>

              {(form.protocol ===
                "tcp" ||
                form.protocol ===
                  "udp") && (
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">
                    Port Range
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-xs text-slate-500">
                        From
                      </span>

                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        placeholder="e.g. 22"
                        value={
                          form.portRangeMin
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,

                              portRangeMin:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs text-slate-500">
                        To
                      </span>

                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        placeholder="e.g. 22"
                        value={
                          form.portRangeMax
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,

                              portRangeMax:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">
                  Remote
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Specify either a
                  CIDR range or another
                  security group. Leave
                  both empty to allow
                  any remote address.
                </p>

                <div className="mt-4 space-y-4">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      CIDR
                    </span>

                    <Input
                      placeholder={
                        form.ethertype ===
                        "IPv6"
                          ? "::/0"
                          : "0.0.0.0/0"
                      }
                      value={
                        form.remoteIpPrefix
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            remoteIpPrefix:
                              event
                                .target
                                .value,

                            remoteGroupId:
                              "",
                          }),
                        )
                      }
                    />
                  </label>

                  <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                    or
                  </div>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Remote Security
                      Group ID
                    </span>

                    <Input
                      placeholder="Security group ID"
                      value={
                        form.remoteGroupId
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            remoteGroupId:
                              event
                                .target
                                .value,

                            remoteIpPrefix:
                              "",
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </span>

                <Input
                  placeholder="Optional description"
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <Button
                  variant="secondary"
                  disabled={
                    submitting
                  }
                  onClick={
                    closeCreateDrawer
                  }
                >
                  Cancel
                </Button>

                <Button
                  disabled={
                    submitting
                  }
                  onClick={
                    createRule
                  }
                >
                  {submitting
                    ? "Adding…"
                    : "Add Rule"}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {deleteRule && (
        <>
          <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[1px]" />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                Delete security
                group rule?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Traffic allowed by
                this rule may stop
                immediately. This
                action cannot be
                undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setDeleteRule(
                      null,
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  disabled={
                    deleting
                  }
                  onClick={
                    confirmDeleteRule
                  }
                >
                  <Trash2 className="h-4 w-4" />

                  {deleting
                    ? "Deleting…"
                    : "Delete Rule"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}