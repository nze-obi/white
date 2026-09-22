import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getCookieOptions,
} from "@/lib/server-api";

const API_BASE =
  process.env.NOBUS_API_BASE ||
  "https://cloud-api.nobus.io";

export async function POST(
  req: NextRequest,
) {
  const token =
    req.cookies.get(
      "nobus_token",
    )?.value;

  /*
   * The Nobus API-key delete endpoint
   * uses TokenBearerAuth.
   *
   * That means we must authenticate
   * this request using the login/session
   * bearer token, NOT the API key itself.
   */
  if (token) {
    try {
      await fetch(
        `${API_BASE}/api/v3/auth/api-key`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },

          cache:
            "no-store",
        },
      );
    } catch {
      /*
       * Logout should still continue
       * even if the upstream API call
       * fails.
       *
       * The local session cookies must
       * always be cleared.
       */
    }
  }

  const response =
    NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      },
    );

  const cookieOptions =
    getCookieOptions(req);

  response.cookies.set(
    "nobus_token",
    "",
    {
      ...cookieOptions,
      maxAge: 0,
    },
  );

  response.cookies.set(
    "nobus_api_key",
    "",
    {
      ...cookieOptions,
      maxAge: 0,
    },
  );

  return response;
}