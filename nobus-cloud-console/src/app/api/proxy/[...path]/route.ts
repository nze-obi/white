import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callNobus,
  checkOrigin,
  jsonResponse,
} from "@/lib/server-api";

async function forward(
  req: NextRequest,
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
   * Preserve the exact proxied pathname, including a trailing slash.
   * This is important for endpoints such as /api/v3/keypair/ where
   * losing the slash can trigger a redirect and change POST behavior.
   */
  const targetPath =
    req.nextUrl.pathname.slice(
      "/api/proxy".length,
    );

  const target =
    `${targetPath}${req.nextUrl.search}`;

  const hasBody =
    ![
      "GET",
      "HEAD",
    ].includes(
      req.method,
    );

  const contentType =
    req.headers.get(
      "content-type",
    ) || "";

  const body =
    hasBody
      ? contentType.includes(
          "multipart/form-data",
        )
        ? await req.arrayBuffer()
        : await req.text()
      : undefined;

  const headers:
    Record<
      string,
      string
    > = {
      Authorization:
        `Bearer ${key}`,
    };

  if (contentType) {
    headers[
      "Content-Type"
    ] = contentType;
  }

  const response =
    await callNobus(
      target,
      {
        method:
          req.method,
        headers,
        body,
      },
    );

  if (
    response.status ===
    401
  ) {
    const result =
      await jsonResponse(
        response,
      );

    result.cookies.set(
      "nobus_api_key",
      "",
      {
        path: "/",
        maxAge: 0,
      },
    );

    return result;
  }

  return jsonResponse(
    response,
  );
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
