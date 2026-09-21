export class ApiError extends Error {
  constructor(message: string, public status: number, public payload?: unknown) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function apiErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback;
  for (const key of ["message", "detail", "error"] as const) {
    const value = data[key];
    if (typeof value === "string" && value) return value;
  }
  return fallback;
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new ApiError(apiErrorMessage(data, `Request failed (${res.status})`), res.status, data);
  }
  return data as T;
}

export function qs(params: Record<string, unknown>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (Array.isArray(v)) v.forEach((x) => u.append(k, String(x)));
      else u.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}
