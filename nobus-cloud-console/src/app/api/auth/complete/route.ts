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
  const body =
    await req.text();

  /*
   * Complete the verification-code
   * login with the Nobus API.
   */
  const login =
    await callNobus(
      "/api/v3/auth/login/complete",
      {
        method: "POST",
        body,
      },
    );

  const text =
    await login.text();

  if (!login.ok) {
    return new NextResponse(
      text,
      {
        status:
          login.status,

        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );
  }

  const data =
    JSON.parse(text);

  const token =
    data.token;

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Login response did not contain a token.",
      },
      {
        status: 502,
      },
    );
  }

  /*
   * Exchange the login token for the
   * Nobus API key used by the console.
   */
  const keyRes =
    await callNobus(
      "/api/v3/auth/api-key",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: "{}",
      },
    );

  const keyText =
    await keyRes.text();

  if (!keyRes.ok) {
    return new NextResponse(
      keyText,
      {
        status:
          keyRes.status,

        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );
  }

  const keyData =
    JSON.parse(keyText);

  const apiKey =
    keyData.api_key;

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "API key response did not contain an API key.",
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

  /*
   * Automatically uses:
   *
   * secure=false on local HTTP
   * secure=true on HTTPS
   */
  const cookieOptions =
    getCookieOptions(req);

  out.cookies.set(
    "nobus_token",
    token,
    cookieOptions,
  );

  out.cookies.set(
    "nobus_api_key",
    apiKey,
    cookieOptions,
  );

  return out;
}