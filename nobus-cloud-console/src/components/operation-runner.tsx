"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { apiRequest, qs } from "@/lib/api-client";
import {
  Operation,
  Schema,
  primitiveType,
  schemaFields,
} from "@/lib/openapi";
import { useCloudContext } from "@/components/cloud-context";
import {
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { titleCase } from "@/lib/utils";

function coerce(value: string, type: string) {
  if (value === "") return undefined;
  if (type === "boolean") return value === "true";
  if (type === "integer" || type === "number") return Number(value);

  if (type === "array" || type === "object") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function OperationRunner({ op }: { op: Operation }) {
  const cloud = useCloudContext();
  const fields = useMemo(() => schemaFields(op.requestSchema), [op]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [params, setParams] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);

  const destructive =
    op.method === "delete" ||
    /delete|remove|clear|invalidate/i.test(op.summary);

  function auto(name: string) {
    if (name === "project_id") {
      return cloud.projectId;
    }

    if (name === "availability_zone") {
      return cloud.availabilityZone;
    }

    return "";
  }

  async function run() {
    if (
      destructive &&
      !confirm(`Confirm: ${op.summary}?`)
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const query: Record<string, unknown> = {};

      /*
       * Build documented query/path parameters.
       */
      for (const parameter of op.parameters) {
        query[parameter.name] = coerce(
          params[parameter.name] ?? auto(parameter.name),
          primitiveType(parameter.schema || {}),
        );
      }

      /*
       * Replace path parameters.
       */
      let path = op.path;

      for (
        const parameter of op.parameters.filter(
          (item) => item.in === "path",
        )
      ) {
        path = path.replace(
          `{${parameter.name}}`,
          encodeURIComponent(
            String(query[parameter.name] ?? ""),
          ),
        );

        delete query[parameter.name];
      }

      /*
       * Build request body.
       */
      const body: Record<string, unknown> = {};

      for (const field of fields) {
        if (field.schema?.format === "binary") {
          continue;
        }

        const raw =
          values[field.name] ?? auto(field.name);

        const value = coerce(
          raw,
          primitiveType(field.schema),
        );

        if (value !== undefined) {
          body[field.name] = value;
        }
      }

      /*
       * Nobus API compatibility.
       *
       * Some live Nobus handlers require project_id and/or
       * availability_zone as query parameters even when the
       * OpenAPI request schema also lists them in the JSON body.
       *
       * Therefore, whenever either field exists in the body
       * schema, send it in BOTH:
       *
       *   - JSON body
       *   - query string
       *
       * This keeps compatibility with endpoints using either
       * validation style.
       */
      for (
        const contextField of [
          "project_id",
          "availability_zone",
        ] as const
      ) {
        const existsInBodySchema = fields.some(
          (field) => field.name === contextField,
        );

        if (!existsInBodySchema) {
          continue;
        }

        const existingQueryValue =
          query[contextField];

        if (
          existingQueryValue !== undefined &&
          existingQueryValue !== null &&
          existingQueryValue !== ""
        ) {
          continue;
        }

        const value =
          body[contextField] ??
          auto(contextField);

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          query[contextField] = value;
        }
      }

      let response: unknown;

      /*
       * Multipart request support.
       */
      if (
        op.requestContentType ===
        "multipart/form-data"
      ) {
        const formData = new FormData();

        for (const field of fields) {
          if (field.schema?.format === "binary") {
            const file = files[field.name];

            if (file) {
              formData.append(
                field.name,
                file,
              );
            }
          } else if (
            body[field.name] !== undefined
          ) {
            const value = body[field.name];

            formData.append(
              field.name,
              typeof value === "object"
                ? JSON.stringify(value)
                : String(value),
            );
          }
        }

        const rawResponse = await fetch(
          `/api/proxy${path}${qs(query)}`,
          {
            method: op.method.toUpperCase(),
            body: formData,
          },
        );

        const text =
          await rawResponse.text();

        let data: unknown = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          data = text;
        }

        if (!rawResponse.ok) {
          const message =
            isRecord(data) &&
            typeof data.message === "string"
              ? data.message
              : isRecord(data) &&
                  typeof data.detail === "string"
                ? data.detail
                : `Request failed (${rawResponse.status})`;

          throw Object.assign(
            new Error(message),
            {
              payload: data,
            },
          );
        }

        response = data;
      } else {
        /*
         * Normal JSON API request.
         */
        response = await apiRequest(
          `${path}${qs(query)}`,
          {
            method:
              op.method.toUpperCase(),

            body:
              fields.length > 0
                ? JSON.stringify(body)
                : undefined,
          },
        );
      }

      setResult(response);
    } catch (caught: unknown) {
      if (
        isRecord(caught) &&
        "payload" in caught
      ) {
        setError(caught.payload);
      } else {
        setError({
          message:
            caught instanceof Error
              ? caught.message
              : "Unexpected error",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          tone={
            op.method === "get"
              ? "blue"
              : op.method === "delete"
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
        {op.tag} · Auth:{" "}
        {op.security.join(", ") ||
          "none documented"}
      </p>

      {destructive && (
        <div className="mt-5 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />

          This operation can modify or remove cloud
          resources. You will be asked to confirm
          before execution.
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {op.parameters.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Parameters
            </h3>

            <div className="space-y-3">
              {op.parameters.map(
                (parameter) => (
                  <Field
                    key={parameter.name}
                    name={parameter.name}
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
                    set={(value) =>
                      setParams(
                        (current) => ({
                          ...current,
                          [parameter.name]:
                            value,
                        }),
                      )
                    }
                  />
                ),
              )}
            </div>
          </section>
        )}

        {fields.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Request body{" "}
              {op.requestSchemaName && (
                <span className="font-normal normal-case">
                  (
                  {
                    op.requestSchemaName
                  }
                  )
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {fields.map(
                (field) => (
                  <Field
                    key={field.name}
                    name={field.name}
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
                    set={(value) =>
                      setValues(
                        (current) => ({
                          ...current,
                          [field.name]:
                            value,
                        }),
                      )
                    }
                    setFile={(file) =>
                      setFiles(
                        (current) => ({
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
          </section>
        )}
      </div>

      <Button
        className="mt-6"
        variant={
          destructive
            ? "danger"
            : "primary"
        }
        disabled={busy}
        onClick={run}
      >
        <Play className="h-4 w-4" />

        {busy
          ? "Running…"
          : "Run operation"}
      </Button>

      {(result !== null ||
        error !== null) && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">
            Response
          </h3>

          <pre
            className={`max-h-[520px] overflow-auto rounded-xl p-4 text-xs ${
              error
                ? "bg-red-950 text-red-100"
                : "bg-slate-950 text-slate-100"
            }`}
          >
            {JSON.stringify(
              error ?? result,
              null,
              2,
            )}
          </pre>
        </section>
      )}
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
}: {
  name: string;
  schema: Schema;
  required?: boolean;
  value: string;
  set: (value: string) => void;
  setFile?: (value: File) => void;
}) {
  const type =
    primitiveType(schema);

  const label = (
    <span className="mb-1.5 block text-sm font-medium">
      {titleCase(name)}

      {required && (
        <span className="text-red-500">
          {" "}
          *
        </span>
      )}

      <span className="ml-2 text-xs font-normal text-slate-400">
        {type}
      </span>
    </span>
  );

  if (schema?.format === "binary") {
    return (
      <label>
        {label}

        <Input
          type="file"
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (
              file &&
              setFile
            ) {
              setFile(file);
            }
          }}
        />
      </label>
    );
  }

  if (type === "boolean") {
    return (
      <label>
        {label}

        <Select
          value={value}
          onChange={(event) =>
            set(event.target.value)
          }
        >
          <option value="">
            Select…
          </option>

          <option value="true">
            true
          </option>

          <option value="false">
            false
          </option>
        </Select>
      </label>
    );
  }

  if (
    type === "array" ||
    type === "object"
  ) {
    return (
      <label>
        {label}

        <Textarea
          value={value}
          onChange={(event) =>
            set(event.target.value)
          }
          placeholder={
            type === "array"
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
          /password|secret/i.test(
            name,
          )
            ? "password"
            : type === "integer" ||
                type === "number"
              ? "number"
              : "text"
        }
        value={value}
        onChange={(event) =>
          set(event.target.value)
        }
        placeholder={
          schema.default !==
          undefined
            ? String(
                schema.default,
              )
            : ""
        }
      />
    </label>
  );
}