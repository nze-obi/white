# Nobus Cloud Console

Production-oriented white-label cloud console built with Next.js, React, TypeScript and Tailwind CSS against the Nobus API v3 OpenAPI specification.

## API coverage

The bundled OpenAPI spec contains **94 paths**, **148 operations**, and **236 schemas**. Every documented operation is callable through the built-in **API Workbench**, while primary cloud resources have dedicated console pages.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Production

Set `NOBUS_API_BASE_URL` to the API origin. Branding is controlled with the `NEXT_PUBLIC_BRAND_*` variables. Tokens and API keys are stored in secure, HTTP-only cookies and API calls are proxied through Next.js route handlers.

```bash
npm run typecheck
npm run build
npm start
```

Or build the included Dockerfile.

## White-labeling

Set per-deployment environment variables for name, logo and primary color. For one deployment serving multiple resellers, set `WHITE_LABEL_CONFIG_JSON`; the console resolves the reseller brand by request hostname at runtime. For larger installations, replace that environment map with your tenant-branding database/service.

## Security notes

- Bearer credentials are never intentionally written to localStorage.
- Mutating proxy requests validate same-origin `Origin` when provided.
- Auth cookies use HttpOnly, Secure in production and SameSite=Lax.
- Destructive API operations require explicit confirmation in the Workbench.
- Review your production CSP, CORS, WAF/rate limiting, SSO/2FA policy, audit logging and secrets management before go-live.
