# AWS Amplify Application Documentation

## Application Overview

| Field | Value |
|---|---|
| App name | dop-c02-site |
| Business purpose | AWS DOP-C02 DevOps Engineer Professional exam study guide — 360 practice questions and domain synthesis content |
| Target users | Individuals preparing for the AWS DOP-C02 certification exam |
| Environments | prod (main branch) |
| Repository URL | https://github.com/nand0l/dop-c02-site |
| Frontend framework | Docusaurus 3 (React) |
| Amplify generation | Gen 1 |

## Architecture

### High-Level Architecture

```
GitHub (main branch)
        │
        ▼
AWS Amplify (CI/CD + Hosting)
        │
        ▼
Static site served via Amplify CDN
(Docusaurus build output — /build)
```

### Frontend Hosting

- AWS Amplify Hosting (static site, no backend/SSR)
- Build output directory: `build/`
- All routing handled client-side by Docusaurus

### Backend Services

None — fully static site. No API, no database, no Lambda functions.

### AWS Region

<!-- TODO: confirm region (e.g. eu-west-1) -->

### Account IDs

| Environment | Account ID |
|---|---|
| prod | <!-- TODO --> |

### Domain / Subdomain Structure

<!-- TODO: e.g. dop-c02.example.com -->

### Data Flow

Browser → Amplify CDN → static HTML/JS/CSS. No backend calls.

---

## Amplify Configuration

### App ID

<!-- TODO: e.g. d2fsuckblr4dzg (visible in Amplify console URL) -->

### Connected Branches

| Branch | Environment | Auto-deploy |
|---|---|---|
| main | prod | yes |

### Build Settings

Defined in [`amplify.yml`](../amplify.yml) at the repository root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
```

### Environment Variables

| Variable | Purpose | Secret |
|---|---|---|
| <!-- TODO --> | <!-- TODO --> | <!-- TODO --> |

### Secrets Handling

<!-- TODO: SSM Parameter Store path: /amplify/<app-id>/<branch>/ -->

### Monorepo

Not applicable — single-app repository.

### Custom Rewrite / Redirect Rules

<!-- TODO: document any rules configured in the Amplify console -->

### Preview Branch Settings

<!-- TODO: are PR previews enabled? -->

---

## Backend Resources

None — static hosting only. See individual architecture files if backend services are added in future.

---

## Data Model

Not applicable — no database.

---

## APIs

Not applicable — no API.

---

## Security

See [networking.md](networking.md) for CORS, WAF, and domain configuration.

### IAM Roles

| Role | Purpose |
|---|---|
| Amplify service role | Build and deploy access |

### Public Access

The site is fully public — no authentication required to view content.

### Secrets Handling

SSM Parameter Store used for any build-time secrets. No secrets committed to the repository.

### Dependency Scanning

<!-- TODO: enable Dependabot or similar on GitHub -->

### Logging and Audit Trail

See [disaster-recovery.md](disaster-recovery.md) for CloudWatch and build log details.

### Encryption

- In transit: HTTPS enforced by Amplify (TLS)
- At rest: not applicable (static files only)

---

## Operations Runbook

### How to Deploy

Push to `main` — Amplify auto-deploys.

### How to Roll Back

In the Amplify console: open the app → **main** branch → select a previous successful build → **Redeploy this version**.

### How to Add an Environment

1. Create a new branch in GitHub
2. In Amplify console: **Connect branch** → select the new branch
3. Configure environment-specific environment variables if needed

### How to Rotate Secrets

1. Update the value in SSM Parameter Store
2. Trigger a new Amplify build (the new value is pulled at build time)

### How to Update Dependencies

```powershell
npm update
npm run typecheck
npm run build   # verify locally before pushing
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### How to Troubleshoot Failed Builds

1. Open Amplify console → **main** branch → failed build → **View build logs**
2. Common causes: npm integrity errors (clear cache via Build settings → Clear cache), TypeScript errors (`npm run typecheck` locally), broken Docusaurus links

### How to Invalidate Cache / Redeploy

In the Amplify console: **Build settings → Clear cache**, then trigger a new build.

---

## Cost Management

### Main Cost Drivers

| Service | Cost driver |
|---|---|
| Amplify Hosting | Build minutes + data transfer |
| Route 53 | Hosted zone + queries (if custom domain) |

### Budget Alerts

<!-- TODO: configure AWS Budget alert -->

---

## Local Development

See [ci-cd.md](ci-cd.md) for full local setup steps.

**Quick start:**

```powershell
node --version   # must be >= 20.0
npm install
npm start        # dev server at http://localhost:3000
```

---

## Handover Notes

### Maintainers

| Name | Role | GitHub |
|---|---|---|
| nand0l | Owner | @nand0l |

### AWS Account Access

<!-- TODO: document how to request access -->

### GitHub Access

Repository: https://github.com/nand0l/dop-c02-site

### Domain / DNS Ownership

<!-- TODO: registrar and DNS provider -->

### Known Limitations

- Static site only — no server-side rendering or dynamic API
- Amplify Gen 1 (not Gen 2)

### Open Issues

<!-- TODO: link to GitHub Issues -->

### Future Improvements

- Interactive quiz mode (spec: `.kiro/specs/interactive-quiz-mode/requirements.md`)
