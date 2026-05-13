# Disaster Recovery

## Overview

This is a static site hosted on AWS Amplify. All source of truth is in Git — the site can be fully rebuilt and redeployed from the repository at any time. There is no database, no user data, and no stateful backend to recover.

## RTO / RPO

| Metric | Target | Notes |
|---|---|---|
| RTO (Recovery Time Objective) | < 30 minutes | Time to redeploy from Git to a new Amplify app |
| RPO (Recovery Point Objective) | 0 | All content is in Git; no data is lost on failure |

## Backup Strategy

| Asset | Backup mechanism |
|---|---|
| Source code and content | Git history on GitHub |
| Build artifacts | Reproducible from source at any time |
| Amplify configuration | Documented in `architecture/aws-amplify-app.md` and `amplify.yml` |

No S3 versioning, DynamoDB PITR, or other backup services are required.

## Restore Steps

### If a bad deploy goes out

1. Identify the last good build in the Amplify console
2. Click **Redeploy this version**, or revert the commit in Git and push

### If the Amplify app is deleted

1. Go to AWS Amplify console → **New app → Host web app**
2. Connect to the GitHub repository `nand0l/dop-c02-site`
3. Select the `main` branch
4. Amplify will detect `amplify.yml` automatically — confirm build settings
5. Configure environment variables (see `architecture/aws-amplify-app.md`)
6. Configure custom domain if applicable (see `architecture/networking.md`)
7. Trigger a build — the site will be live within ~5 minutes

### If GitHub is unavailable

The local clone is the fallback. Push to a new repository or a different Git provider and reconnect Amplify.

## Infrastructure Redeployment Steps

All infrastructure is managed through the Amplify console (Gen 1). To recreate from scratch:

1. Create new Amplify app (see restore steps above)
2. Apply rewrite/redirect rules from `architecture/networking.md`
3. Configure custom domain
4. Set environment variables and SSM parameters
5. Configure build notifications

---

## Monitoring and Logging

### Amplify Build Logs

Available in the Amplify console under each branch → build history. Retained by Amplify for the duration of the app.

### CloudWatch Log Groups

| Log group | Content | Retention |
|---|---|---|
| <!-- TODO: `/aws/amplify/<app-id>` --> | Build logs | <!-- TODO --> |

### Lambda Logs

Not applicable — no Lambda functions.

### AppSync Logs

Not applicable — no AppSync API.

### API Gateway Logs

Not applicable — no API Gateway.

### Cognito Logs / Events

Not applicable — no authentication.

### Frontend Error Tracking

<!-- TODO: consider adding Sentry or CloudWatch RUM for client-side error tracking -->

| Tool | Status |
|---|---|
| Sentry | not configured |
| CloudWatch RUM | not configured |

### Alarms

<!-- TODO: configure CloudWatch alarms for build failures or high error rates -->

| Alarm | Metric | Threshold | Action |
|---|---|---|---|
| <!-- TODO --> | <!-- TODO --> | <!-- TODO --> | <!-- TODO --> |

### Dashboards

<!-- TODO: CloudWatch dashboard for build metrics and CDN metrics -->
