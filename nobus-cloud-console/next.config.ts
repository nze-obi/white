import type {
  NextConfig,
} from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  reactStrictMode: true,

  /*
   * IMPORTANT:
   *
   * Nobus has API routes where a trailing
   * slash matters, for example:
   *
   * /api/v3/keypair/
   *
   * Do not let Next.js automatically
   * remove that slash.
   */
  skipTrailingSlashRedirect: true,

  async headers() {
    return [
      {
        source: "/(.*)",

        headers: [
          {
            key:
              "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key:
              "Referrer-Policy",
            value:
              "strict-origin-when-cross-origin",
          },
          {
            key:
              "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=()",
          },
          {
            key:
              "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;