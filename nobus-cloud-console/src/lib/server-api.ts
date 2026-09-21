import {
  NextRequest,
  NextResponse,
} from "next/server";

const base = (
  process.env.NOBUS_API_BASE_URL ||
  "https://cloud-api.nobus.io"
).replace(/\/$/, "");

export function getCookieOptions(
  req: NextRequest,
) {
  const forwardedProto =
    req.headers.get(
      "x-forwarded-proto",
    );

  const isHttps =
    forwardedProto === "https" ||
    req.nextUrl.protocol ===
      "https:";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export async function callNobus(
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(
    init.headers,
  );

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json",
    );
  }

  if (
    init.body &&
    typeof init.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  return fetch(
    `${base}${path}`,
    {
      ...init,
      headers,
      cache: "no-store",
    },
  );
}

export async function jsonResponse(
  res: Response,
) {
  const text =
    await res.text();

  const headers = new Headers({
    "Content-Type":
      res.headers.get(
        "content-type",
      ) ||
      "application/json",
  });

  return new NextResponse(
    text || null,
    {
      status: res.status,
      headers,
    },
  );
}

export function checkOrigin(
  req: NextRequest,
) {
  const origin =
    req.headers.get("origin");

  /*
   * Requests without an Origin header
   * are allowed.
   */
  if (!origin) {
    return true;
  }

  try {
    const originUrl =
      new URL(origin);

    /*
     * Prefer a forwarded host when one
     * exists. Otherwise use the actual
     * Host header received by Next.js.
     *
     * This works for:
     *
     * - localhost
     * - Docker accessed directly
     * - public IP access
     * - domains
     * - reverse proxies if added later
     */
    const host =
      req.headers.get(
        "x-forwarded-host",
      ) ||
      req.headers.get("host") ||
      req.nextUrl.host;

    return (
      originUrl.host === host
    );
  } catch {
    return false;
  }
}