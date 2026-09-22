import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callNobus,
  getCookieOptions,
} from "@/lib/server-api";

export async function POST(
  req: NextRequest,
) {
  const token =
    req.cookies.get(
      "nobus_token",
    )?.value;

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Authentication token not found.",
      },
      {
        status: 401,
      },
    );
  }

  const response =
    await callNobus(
      "/api/v3/auth/api-key/refresh",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

  const text =
    await response.text();

  if (!response.ok) {
    return new NextResponse(
      text,
      {
        status:
          response.status,

        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );
  }

  const data =
    JSON.parse(text);

  const apiKey =
    data.api_key;

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "API refresh response did not contain an API key.",
      },
      {
        status: 502,
      },
    );
  }

  const out =
    NextResponse.json({
      ok: true,
    });

  const cookieOptions =
    getCookieOptions(req);

  out.cookies.set(
    "nobus_api_key",
    apiKey,
    cookieOptions,
  );

  return out;
}