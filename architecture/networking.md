# Networking

## Domain / Subdomain Structure

| Environment | Domain | DNS provider |
|---|---|---|
| prod | <!-- TODO: e.g. dop-c02.example.com --> | <!-- TODO --> |

Amplify provides a default domain (`<branch>.<app-id>.amplifyapp.com`) before a custom domain is configured.

## Custom Domain Setup

<!-- TODO: document steps taken in Amplify console → Domain management -->

| Field | Value |
|---|---|
| Custom domain | <!-- TODO --> |
| SSL certificate | Managed by Amplify (ACM) |
| HTTPS enforced | yes |

## Rewrite / Redirect Rules

Rules are configured in the Amplify console under **Rewrites and redirects**.

| Source | Target | Type | Purpose |
|---|---|---|---|
| `/<*>` | `/index.html` | 200 | SPA fallback for client-side routing |
| <!-- TODO --> | <!-- TODO --> | <!-- TODO --> | <!-- TODO --> |

## CORS

Not applicable — the site is fully static with no API calls from the browser to a separate origin.

If an API is added in future:

| Setting | Value |
|---|---|
| Allowed origins | <!-- TODO --> |
| Allowed methods | <!-- TODO --> |
| Allowed headers | <!-- TODO --> |
| Credentials | <!-- TODO --> |

## WAF

<!-- TODO: is AWS WAF attached to the Amplify app or CloudFront distribution? -->

| Setting | Value |
|---|---|
| WAF enabled | <!-- TODO: yes/no --> |
| Web ACL name | <!-- TODO --> |
| Managed rules | <!-- TODO --> |
| Rate limiting | <!-- TODO --> |

## CloudFront

Amplify Hosting uses CloudFront under the hood. Direct CloudFront configuration is not exposed in Gen 1.

| Setting | Value |
|---|---|
| Cache invalidation on deploy | automatic (Amplify handles this) |
| Custom cache behaviours | <!-- TODO --> |

## Security Headers

<!-- TODO: document any custom security headers configured via Amplify console or amplify.yml -->

| Header | Value |
|---|---|
| Strict-Transport-Security | <!-- TODO --> |
| Content-Security-Policy | <!-- TODO --> |
| X-Frame-Options | <!-- TODO --> |
| X-Content-Type-Options | <!-- TODO --> |
