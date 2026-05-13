# CI/CD Pipeline

## Overview

AWS Amplify Hosting provides the CI/CD pipeline. Every push to a connected branch triggers an automatic build and deploy.

## Git Provider

GitHub — <https://github.com/nand0l/dop-c02-site>

## Branch-to-Environment Mapping

| Branch | Environment | Auto-deploy |
| --- | --- | --- |
| main | prod | yes |

## Build Configuration

Defined in `amplify.yml` at the repository root.

| Phase | Command |
| --- | --- |
| preBuild | `npm ci --cache .npm` |
| build | `npm run build` |
| artifact directory | `build/` |
| cache paths | `.npm/**/*` |

## Local Development Setup

### Required Tools

| Tool | Minimum version |
| --- | --- |
| Node.js | 20.0 |
| npm | bundled with Node |
| Git | any recent |

### Local Setup Steps

```powershell
git clone https://github.com/nand0l/dop-c02-site.git
cd dop-c02-site
npm install
npm start        # dev server at http://localhost:3000 with hot reload
```

### Other Useful Commands

```powershell
npm run build        # production build → ./build/
npm run serve        # serve the production build locally
npm run typecheck    # TypeScript type checking
npm run clear        # clear Docusaurus cache (use when builds behave oddly)
```

### Environment Files

No `.env` files required — the site is fully static with no runtime secrets.

### Local Testing

There is no automated test suite. Verify changes by:

1. Running `npm run typecheck` — catches TypeScript errors
2. Running `npm run build` — catches broken links (warnings) and build errors
3. Running `npm start` and reviewing in a browser

### Mocking Strategy

Not applicable — no backend or API calls.

### Connecting to AWS Resources

Not applicable — the site is fully static.

## Test Command

None configured — see local testing above.

## Manual Approval Steps

None — all pushes to `main` deploy automatically.

## Rollback Process

1. In the Amplify console open the app
2. Select the **main** branch
3. Find the last successful build
4. Click **Redeploy this version**

Alternatively, revert the commit in Git and push — Amplify will build and deploy the reverted version.

## Build Notifications

<!-- TODO: configure build notifications (email / Slack) via Amplify console → Notifications -->

## Pipeline Owner

| Name | GitHub |
| --- | --- |
| nand0l | @nand0l |
