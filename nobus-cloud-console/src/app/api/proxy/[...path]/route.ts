import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callNobus,
  jsonResponse,
  checkOrigin,
} from "@/lib/server-api";

async function forward(
  req: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  if (
    req.method !== "GET" &&
    !checkOrigin(req)
  ) {
    return NextResponse.json(
      {
        message:
          "Origin validation failed",
      },
      {
        status: 403,
      },
    );
  }

  const key =
    req.cookies.get(
      "nobus_api_key",
    )?.value;

  if (!key) {
    return NextResponse.json(
      {
        message:
          "Authentication required",
      },
      {
        status: 401,
      },
    );
  }

  /*
   * IMPORTANT:
   *
   * Do NOT reconstruct the Nobus URL from
   * context.params because doing:
   *
   *   "/" + path.join("/")
   *
   * removes trailing slashes.
   *
   * Some Nobus endpoints such as:
   *
   *   /api/v3/keypair/
   *
   * require that trailing slash.
   */
  const proxyPrefix =
    "/api/proxy";

  let upstreamPath =
    req.nextUrl.pathname.slice(
      proxyPrefix.length,
    );

  if (!upstreamPath) {
    upstreamPath = "/";
  }

  const target =
    `${upstreamPath}${req.nextUrl.search}`;

  const hasBody =
    !["GET", "HEAD"].includes(
      req.method,
    );

  const contentType =
    req.headers.get(
      "content-type",
    ) || "";

  let body:
    | string
    | ArrayBuffer
    | undefined;

  if (hasBody) {
    if (
      contentType.includes(
        "multipart/form-data",
      )
    ) {
      body =
        await req.arrayBuffer();
    } else {
      body =
        await req.text();
    }
  }

  const headers:
    Record<string, string> = {
      Authorization:
        `Bearer ${key}`,
    };

  if (contentType) {
    headers["Content-Type"] =
      contentType;
  }

  const res =
    await callNobus(
      target,
      {
        method: req.method,
        headers,
        body,
      },
    );

  if (res.status === 401) {
    const response =
      await jsonResponse(res);

    response.cookies.set(
      "nobus_api_key",
      "",
      {
        path: "/",
        maxAge: 0,
      },
    );

    return response;
  }

  return jsonResponse(res);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;