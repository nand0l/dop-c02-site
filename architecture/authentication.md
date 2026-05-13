# Authentication

## Current Status

This site is fully public — no authentication is required to view content. There is no Cognito user pool, identity pool, or login flow.

If authentication is added in future, document it using the sections below.

---

## Cognito User Pool

| Field | Value |
| --- | --- |
| User pool ID | <!-- TODO --> |
| User pool name | <!-- TODO --> |
| Region | <!-- TODO --> |

## Identity Pool

| Field | Value |
| --- | --- |
| Identity pool ID | <!-- TODO --> |
| Unauthenticated access | <!-- TODO: enabled/disabled --> |

## Sign-In Methods

- [ ] Email / password
- [ ] Username / password
- [ ] Google
- [ ] Facebook
- [ ] Apple
- [ ] SAML
- [ ] OIDC

## Password Policy

| Setting | Value |
| --- | --- |
| Minimum length | <!-- TODO --> |
| Require uppercase | <!-- TODO --> |
| Require numbers | <!-- TODO --> |
| Require symbols | <!-- TODO --> |
| Temporary password expiry | <!-- TODO --> |

## MFA Settings

| Setting | Value |
| --- | --- |
| MFA enforcement | <!-- TODO: optional/required/off --> |
| MFA methods | <!-- TODO: TOTP / SMS --> |

## User Groups and Roles

| Group | IAM role | Purpose |
| --- | --- | --- |
| <!-- TODO --> | <!-- TODO --> | <!-- TODO --> |

## Token Usage

| Token | Expiry | Usage |
| --- | --- | --- |
| Access token | <!-- TODO --> | API authorization |
| ID token | <!-- TODO --> | User identity claims |
| Refresh token | <!-- TODO --> | Obtain new tokens |

## Callback and Logout URLs

| Environment | Callback URL | Logout URL |
| --- | --- | --- |
| prod | <!-- TODO --> | <!-- TODO --> |

## Authorization Model

<!-- TODO: describe how authorization decisions are made (e.g. Cognito groups → IAM roles → resource access) -->
