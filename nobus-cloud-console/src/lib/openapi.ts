import spec from "@/generated/openapi.json";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Schema = {
  $ref?: string;
  type?: string;
  title?: string;
  format?: string;
  description?: string;
  default?: JsonValue;
  enum?: JsonValue[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  anyOf?: Schema[];
  oneOf?: Schema[];
  allOf?: Schema[];
  additionalProperties?: boolean | Schema;
  [key: string]: unknown;
};

type OpenApiParameter = {
  name: string;
  in: string;
  required?: boolean;
  schema?: Schema;
};

type OpenApiMedia = { schema?: Schema };
type OpenApiRequestBody = { content?: Record<string, OpenApiMedia> };
type OpenApiSecurityRequirement = Record<string, unknown>;

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  tags?: string[];
  security?: OpenApiSecurityRequirement[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
};

type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>> & Record<string, unknown>;
type OpenApiSpec = {
  paths: Record<string, OpenApiPathItem>;
  components: { schemas: Record<string, Schema> };
};

export type Operation = {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  tag: string;
  security: string[];
  parameters: OpenApiParameter[];
  requestSchema?: Schema;
  requestSchemaName?: string;
  requestContentType?: string;
};

const openApiSpec = spec as unknown as OpenApiSpec;
const methods = new Set<HttpMethod>(["get", "post", "put", "patch", "delete"]);

function isHttpMethod(value: string): value is HttpMethod {
  return methods.has(value as HttpMethod);
}

function schemaName(ref?: string) {
  return ref?.split("/").pop();
}

export function resolveSchema(schema?: Schema): Schema | undefined {
  if (!schema) return undefined;
  if (schema.$ref) {
    const name = schemaName(schema.$ref);
    return name ? openApiSpec.components.schemas[name] : undefined;
  }
  return schema;
}

export const operations: Operation[] = Object.entries(openApiSpec.paths).flatMap(
  ([path, pathItem]) =>
    Object.entries(pathItem)
      .filter(([method, operation]) => isHttpMethod(method) && Boolean(operation))
      .map(([method, operation]) => {
        if (!isHttpMethod(method) || !operation || typeof operation !== "object") {
          throw new Error(`Invalid OpenAPI operation for ${method.toUpperCase()} ${path}`);
        }

        const op = operation as OpenApiOperation;
        const content = op.requestBody?.content ?? {};
        const requestContentType = content["application/json"]
          ? "application/json"
          : content["multipart/form-data"]
            ? "multipart/form-data"
            : Object.keys(content)[0];
        const bodySchema = requestContentType ? content[requestContentType]?.schema : undefined;

        return {
          id: op.operationId ?? `${method}:${path}`,
          method,
          path,
          summary: op.summary ?? `${method.toUpperCase()} ${path}`,
          tag: op.tags?.[0] ?? "Other",
          security: (op.security ?? []).flatMap((requirement) => Object.keys(requirement)),
          parameters: op.parameters ?? [],
          requestSchema: resolveSchema(bodySchema),
          requestSchemaName: schemaName(bodySchema?.$ref),
          requestContentType,
        };
      }),
);

export const operationById = new Map(operations.map((operation) => [operation.id, operation]));
export const schemas = openApiSpec.components.schemas;
export const apiStats = {
  paths: Object.keys(openApiSpec.paths).length,
  operations: operations.length,
  schemas: Object.keys(schemas).length,
};

export function schemaFields(schema?: Schema) {
  const resolved = resolveSchema(schema);
  if (!resolved) return [];

  return Object.entries(resolved.properties ?? {}).map(([name, value]) => ({
    name,
    schema: value,
    required: (resolved.required ?? []).includes(name),
  }));
}

export function primitiveType(schema: Schema): string {
  if (schema.$ref) return "object";
  if (schema.type) return schema.type;
  if (schema.anyOf) {
    const candidate = schema.anyOf.find((value) => value.type && value.type !== "null");
    return candidate?.type ?? "string";
  }
  return "string";
}
