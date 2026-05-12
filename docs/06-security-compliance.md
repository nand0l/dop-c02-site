# Domain 6 - Security and Compliance

**Source questions covered (90)**: Q8, Q9, Q11, Q15, Q25, Q26, Q29, Q33, Q37, Q38, Q42, Q48, Q52, Q53, Q63, Q66, Q67, Q77, Q80, Q81, Q85, Q94, Q95, Q98, Q105, Q108, Q109, Q110, Q122, Q136, Q139, Q144, Q145, Q151, Q152, Q155, Q160, Q162, Q164, Q165, Q172, Q174, Q177, Q179, Q181, Q183, Q190, Q198, Q200, Q201, Q206, Q211, Q212, Q214, Q216, Q217, Q230, Q231, Q236, Q241, Q245, Q249, Q254, Q260, Q267, Q268, Q273, Q284, Q288, Q291, Q292, Q296, Q300, Q304, Q327, Q328, Q346, Q352, Q354, Q358, Q364, Q365, Q369, Q370, Q373, Q376, Q377, Q378, Q379, Q384.

:::tip

## Learning Objectives

- Apply IAM correctly: identity-based vs resource-based policies, permission boundaries, conditions, ABAC, trust policies.
- Use AWS Organizations effectively: OUs, SCPs, RCPs, tag policies, AI service opt-outs.
- Operate AWS Control Tower, Customizations for Control Tower (CfCT), and Account Factory Customization (AFC).
- Continuous compliance via AWS Config, Security Hub, Conformance Packs, and aggregator.
- Threat detection with GuardDuty, Inspector, Macie, Detective, and Network Firewall integration.
- Manage secrets with Secrets Manager and KMS; protect data at rest and in transit.

:::

---

## 1. The Organizations + Control Tower foundation

| Service | Purpose | Notes |
| --- | --- | --- |
| **AWS Organizations** | Multi-account container; consolidated billing; SCPs; tag policies; backup policies | Required for all of the below |
| **AWS Control Tower** | Landing zone with prescriptive baseline (org structure, log archive account, audit account, mandatory guardrails) | Sits on top of Organizations |
| **Account Factory Customization (AFC)** | Apply CloudFormation blueprint to every new account provisioned via Control Tower | Native, low-overhead account baseline (Q364, Q369) |
| **Customizations for Control Tower (CfCT)** | Apply additional CloudFormation templates + SCPs in response to org events | More flexible than AFC; OU-targeting (Q48) |
| **IAM Identity Center (formerly AWS SSO)** | SSO with corporate IdP; permission sets across all accounts | Use SAML/OIDC trust with Okta/Azure AD/Google (Q11, Q231, Q245, Q358) |

### Service Control Policies (SCPs) - 12 rules to remember

1. SCPs apply to **member accounts only** -- they do not restrict the management account.
2. SCPs **do not grant** permissions -- they set the maximum scope. An IAM principal still needs an identity-based policy that allows the action.
3. An empty SCP `{Statement: []}` blocks everything; the default `FullAWSAccess` SCP must be present unless you want allow-list behavior.
4. SCPs **cannot use the Principal element** -- this is the most common wrong-answer trap (Q80).
5. Allow-list SCPs (`Allow` only services X, Y) require **removing `FullAWSAccess`** from every layer (Q94, Q358).
6. **Deny statements at any OU level** override allows below.
7. Use `aws:RequestedRegion` condition for Region restrictions (Q189, Q280).
8. Use `aws:PrincipalOrgID` and `aws:PrincipalOrgPaths` for org-scoped allow-listing.
9. Use `aws:SourceIp` to restrict by CIDR (Q145, Q211).
10. Use `ec2:SourceInstanceARN` and `ec2:RoleDelivery` conditions to **prevent EC2 credentials from being used outside their instance** (Q241).
11. Use `Null` condition on `lambda:VpcIds` to require Lambda VPC attachment (Q352).
12. Use `aws:PrincipalArn` with negation in a Deny to block specific roles, including root, when applicable.

:::warning

## Exam tip - SCP semantics

SCPs are filters, not grants. If a question says "all users should be denied X", an SCP with `"Effect": "Deny"` plus an appropriate condition is correct. If it says "only the pipeline role can deploy to prod", you need a permission boundary or a Deny SCP that excludes the pipeline role -- not an Allow SCP, which doesn't grant anything (Q296).
:::

### Resource Control Policies (RCPs)

Newer than SCPs. RCPs limit the **maximum permissions for resources** across the org (cross-account access via resource policies). Used to enforce, for example, that no S3 bucket in any account can be made public (Q300).

### Tag policies and backup policies

- **Tag policies** at OU level enforce tag keys/values with `enforced_for` on supported services.
- **Backup policies** propagate AWS Backup plans across the org.

---

## 2. IAM identity essentials

### IAM principals and policies

| Type | Examples |
| --- | --- |
| Identity-based policy | IAM user, group, role |
| Resource-based policy | S3 bucket policy, KMS key policy, Lambda function policy, SQS, SNS, ECR, Secrets Manager, EFS file system policy |
| Permissions boundary | A managed policy that caps a role's effective permissions |
| Session policy | Passed in `AssumeRole`; further restricts the assumed session |
| SCP | Org-level guardrail (see above) |

Effective permissions = (intersection of all of the above) - any explicit Deny.

### Cross-account access patterns

| Goal | Mechanism |
| --- | --- |
| Lambda in A reads S3 in B | Bucket policy in B trusts A's principal; Lambda role in A has S3 read (Q37) |
| Pipeline in A deploys CloudFormation in B | Cross-account deploy role in B trusts A's CodePipeline role; KMS CMK in A grants Decrypt to B (Q110, Q347) |
| Audit in A reads logs in B | IAM role in B with read-only trust on A's audit role; deployed via StackSets (Q268) |
| Acquired company joins org | Invite or migrate accounts; create `OrganizationAccountAccessRole` in member accounts (Q139, Q177) |

### Trust policies vs identity policies

- A **trust policy** (principal element) decides *who can assume* a role.
- An **identity policy** decides *what the role can do*.
- For acquired-company invited accounts, the management account must create the `OrganizationAccountAccessRole` in the member account with a trust policy permitting the management account; the management account uses `sts:AssumeRole` (Q139).

### IMDSv2

For "require IMDSv2 on all instances":

- AWS Config managed rule `ec2-imdsv2-check` evaluates `HttpTokens` (must be `required`).
- Configure the launch template `MetadataOptions: HttpTokens=required, HttpPutResponseHopLimit=1` (Q165).

### Bastion replacements

- **AWS Systems Manager Session Manager** is the AWS-native replacement for SSH bastion hosts; sessions are logged to CloudTrail + CloudWatch Logs.
- For prohibited interactive logins: send `/var/log/secure` or `/var/log/auth.log` to CloudWatch Logs via the CloudWatch agent + alarms on failed SSH (Q99, Q62, Q42).

### ABAC patterns

- Pass identity attributes (e.g., AD group name) as **session tags** via SAML/SSO.
- Use `aws:PrincipalTag/Team` and `aws:ResourceTag/Team` in IAM policy conditions.
- Tag the resource with the team name; only matching principals can act on it (Q11, Q25, Q160).

### Roles Anywhere

- Issue X.509 certificates from AWS Private CA.
- Configure an IAM Roles Anywhere trust anchor that trusts the CA.
- On-premises/CI servers authenticate with the cert and get temporary AWS credentials (Q210, Q273).

---

## 3. AWS Config

| Element | Purpose |
| --- | --- |
| Configuration recorder | Records changes for selected resource types |
| Delivery channel | Pushes snapshots/notifications to S3/SNS |
| Managed rules | Prebuilt compliance checks (e.g., `s3-bucket-public-write-prohibited`, `restricted-ssh`, `ec2-imdsv2-check`) |
| Custom rules | Lambda-backed compliance checks (Q236) |
| Conformance pack | Bundle of rules + remediation, deployable across an org |
| Aggregator | Org-wide read view of compliance across accounts and Regions (Q67) |
| Remediation action | SSM Automation document that runs on `NON_COMPLIANT` |

For org-wide Config management:

1. Designate the **audit account** as the **delegated administrator** for AWS Config.
2. Create a **Config aggregator** in the audit account covering all accounts and Regions.
3. Deploy Conformance Packs to the org root for standard baselines.

For org-wide CloudTrail + Config baseline:

- Use **CloudFormation StackSets** to deploy the configuration recorder + delivery channel in every account, and an SCP to prevent users from disabling them (Q66, Q67, Q190).

### Common managed rules referenced in source corpus

| Rule | Use case |
| --- | --- |
| `restricted-ssh` | Inbound SSH (port 22) from 0.0.0.0/0 (Q96) |
| `s3-bucket-server-side-encryption-enabled` | Bucket-level SSE (Q130) |
| `ec2-instance-profile-attached` | EC2 must have instance profile (Q13, Q322) |
| `ec2-imdsv2-check` | Require IMDSv2 (Q165) |
| `ec2-ebs-encryption-by-default` | EBS encryption at account level (Q52) |
| `alb-waf-enabled` | WAF web ACL associated with ALB (Q291) |
| `CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK` | Stack drift compliance (Q311) |
| `iam-policy-no-statements-with-admin-access` | Identify over-permissive policies |

### Auto-remediation pattern

Config rule -> non-compliant -> automatic remediation action = SSM Automation document (e.g., `AWS-DisablePublicAccessForS3Bucket`, `AWS-AttachIAMToInstance`, `AWS-EnableS3BucketEncryption`).

---

## 4. AWS Security Hub

- Aggregates findings from **GuardDuty, Inspector, Macie, IAM Access Analyzer, Firewall Manager, Config, and partner products** (Crowdstrike, Snyk, etc.) into a single ASFF (AWS Security Finding Format) view.
- Supports **CIS, PCI DSS, AWS Foundational Security Best Practices** standards.
- Use **delegated administrator** in Organizations to manage Security Hub across accounts (Q98).
- Auto-enable Security Hub in new member accounts (Q98).
- Auto-remediation: EventBridge rule on Security Hub Finding -> Lambda or SSM Automation (Q190, Q206).

---

## 5. Threat detection services

| Service | Primary signal | Key exam patterns |
| --- | --- | --- |
| **GuardDuty** | VPC Flow Logs + DNS logs + CloudTrail | Detects compromised credentials, crypto mining (`CryptoCurrency:EC2/BitcoinTool.B`), port scans (Q122, Q225, Q368) |
| **Amazon Inspector** | Continuous scanning of EC2 (SSM Agent), Lambda, ECR images | Vulnerability assessment, CVE coverage; replaces classic Inspector (Q53, Q100, Q177, Q256, Q299) |
| **Amazon Macie** | S3 data classification | Detects PII, financial data; exclude non-sensitive buckets via job scope to manage cost (Q164, Q284) |
| **AWS Detective** | Behavioral graph analysis on CloudTrail + VPC Flow + GuardDuty | Investigation, not detection |
| **IAM Access Analyzer** | Resource-based policy analysis; unused-access analysis | Find roles never used, resources shared externally (Q155) |

### GuardDuty + Organizations

- Set up **delegated administrator** account for GuardDuty.
- Auto-enable for new member accounts.
- For automatic blocking of malicious IPs from GuardDuty findings, route findings to **Network Firewall** via EventBridge + Lambda updating a Network Firewall rule group (Q206).
- For crypto-mining response: EventBridge on the GuardDuty finding -> Lambda that revokes IAM keys, modifies SG, and terminates the instance (Q368).

### Inspector v2

- Uses **SSM Agent** on EC2 instances for OS package scanning.
- Three requirements for EC2 scanning: SSM Agent installed and running, instance has a SSM-compatible IAM role, instance not on the exclusion list.
- Scans **ECR images** automatically with enhanced scanning (Q256, Q299).
- Scans **Lambda** functions for vulnerable dependencies.

### Macie cost optimization

- Disable automated discovery on buckets that don't store sensitive data using **automated discovery exclusions** (Q164).
- Define jobs with explicit S3 bucket criteria.

---

## 6. Secrets and key management

### Secrets Manager rotation

| Engine | Rotation |
| --- | --- |
| RDS (MySQL/PostgreSQL/Oracle/SQL Server), DocumentDB, Redshift | **Managed rotation** (no Lambda needed for newer engines) |
| ElastiCache for Redis | Lambda rotation function with Redis template (Q359) |
| Other (custom API, third-party DB) | Lambda rotation template you customize (Q105, Q384) |

Cross-Region replication: enable **replica secrets** in target Regions.

### KMS

- **Customer-managed keys (CMKs)** are the default for cross-account access -- you control the key policy. **AWS-managed keys** (`aws/s3`, `aws/rds`, etc.) cannot be modified.
- For cross-account encrypted artifacts (e.g., CodePipeline artifact bucket consumed by a deploy account), **always use a customer-managed CMK** (Q110, Q347, Q378).
- KMS **automatic key rotation** rotates the key material yearly; **manual rotation** creates new key versions on demand. For compliance, configure a Config rule that detects keys older than N days without rotation (Q9).
- Encryption context (KMS) is an extra layer of authorization for `Encrypt`/`Decrypt` calls.

### Parameter Store SecureString

- Encrypts with KMS. The default key (`aws/ssm`) is fine for single-account; use a CMK for cross-account access.
- IAM controls who can read; the KMS key policy controls who can decrypt.

---

## 7. Network and edge security

### AWS WAF

- Three resource types: ALB, CloudFront, API Gateway, AppSync.
- **AWS Firewall Manager** centrally applies WAF web ACLs across an org. Use `Auto remediate any noncompliant resources` to auto-create web ACLs in member accounts (Q8).
- For region-restricted access, attach an IP set rule.
- For CloudFront -> API Gateway restricted access, use a **custom origin header** that API Gateway resource policy validates (Q346).

### AWS Shield

- Shield Standard: free, automatic DDoS protection.
- Shield Advanced: paid, includes WAF at no extra cost, DDoS Response Team access, cost protection.

### Network Firewall

- VPC-level managed firewall (Suricata-compatible rules). Route VPC traffic through Firewall endpoints.
- Pair with GuardDuty findings to auto-update deny rule groups (Q206).

### API Gateway resource policies

- Restrict by **VPC**: `aws:SourceVpc` or `aws:SourceVpce` condition in the API resource policy (Q267).
- Restrict to **specific account**: principal element with account ARN.
- mTLS for custom domains: upload truststore bundle to S3, configure mTLS on the custom domain mapping (Q179).

### VPC Endpoints

- **Gateway endpoint** for S3 and DynamoDB (free).
- **Interface endpoint** (PrivateLink) for most other services (paid).
- Use `s3:VpcSourceIp` and gateway endpoint policies to lock down access to specific VPCs (Q15).

### PrivateLink for overlapping CIDR multi-account fan-in

When 20 service VPCs use the same CIDR (`192.168.0.0/16`) and cannot peer, expose each service via PrivateLink endpoint services and let consumers connect through interface endpoints (Q109).

---

## 8. Data protection patterns

### S3

| Goal | Mechanism |
| --- | --- |
| Block public access | Account-level **Block Public Access** + bucket-level setting |
| Enforce TLS | Bucket policy denying `aws:SecureTransport = false` |
| Enforce KMS encryption on uploads | Bucket policy denying `s3:PutObject` when `s3:x-amz-server-side-encryption` is not `aws:kms`; SCP for org-wide (Q254) |
| Cross-account access | Bucket policy + IAM role + KMS CMK if encrypted |
| Object Lambda | Apply transformations / redactions on GET (Q172) |
| Server access logging | Native logging to another bucket; query with Athena (Q60) |
| Inventory | Periodic CSV of all objects |
| Glacier vault lock | Compliance-grade write-once retention |
| S3 Multi-Region Access Points (MRAP) | Single endpoint over multiple buckets (Q307, Q362) |

### EC2 / EBS

- **Default EBS encryption** can be set per Region; enforce via SCP or Config (Q52).
- Snapshot copy across Regions uses KMS multi-Region keys or copy + re-encrypt.

### Audit-account replication

For DR backups crossing accounts and Regions: AWS Backup with backup vault in DR account, vault access policy granting source account `backup:CopyIntoBackupVault`, KMS CMK with grant for cross-account decrypt (Q174, Q378).

---

## 9. Common patterns the corpus tests heavily

### "Run a Lambda when an IAM user is created"

CloudTrail emits `CreateUser`. EventBridge rule on that event invokes Lambda that disables the user / sends notification (Q71). For IAM Identity Center users (SAML/SSO), no `CreateUser` API call -- monitor IAM Identity Center events instead.

### "Notify SecOps when something happens in every account"

Service-managed StackSets with auto-deployment -> CloudFormation template that creates an EventBridge rule + SNS topic with SecOps subscription (Q30, Q63).

### "Ensure no developer creates an unencrypted EBS volume"

- Preventive: SCP denying `ec2:CreateVolume` with `Encrypted=false`.
- Detective: Config rule `encrypted-volumes` + remediation (Q52).
- Account-level: enable **EBS encryption by default**.

### "Restrict region usage"

- SCP **allow-list** for approved Regions at the root, with exceptions for global services (IAM, CloudFront, Route 53, Organizations).
- Use `aws:RequestedRegion` condition (Q189, Q280).

### "Acquired company integration"

- Invite the company's accounts to your Organization.
- The invited account creates an `OrganizationAccountAccessRole` with trust on your management account.
- Bring under existing OUs to inherit SCPs; enable Config, GuardDuty, Security Hub as members of your delegated administrators (Q139, Q177).

### "Centralize logging across all accounts"

- Organization CloudTrail trail -> S3 bucket in audit account.
- Config aggregator in audit account.
- Security Hub master in audit account.
- Macie administrator + delegated admin in audit account.

### "Enforce Lambda VPC attachment"

SCP with `Null` condition on `lambda:VpcIds` denies create/update of functions without VPC attached (Q352).

### "Enforce restricted instance types"

SCP with `aws:RequestedRegion` + `ec2:InstanceType` conditions on `ec2:RunInstances` (Q260).

### "Restrict EC2 credentials to their host"

SCP using `ec2:SourceInstanceARN` to deny use of an EC2 instance role from any source other than that instance ARN (Q241).

---

## 10. Permission boundaries and least-privilege

- **Permissions boundary** is a managed policy attached to a role/user that caps maximum permissions.
- Use to delegate role creation to dev teams safely: a developer can create new roles, but the boundary prevents the new role from exceeding allowed actions.
- For Lambda execution roles needing least-privilege secrets access, give explicit `secretsmanager:GetSecretValue` for **the specific secret ARN**, not `*` (Q77).
- For S3 with VPC restriction, combine identity policy + S3 VPC endpoint policy (Q15, Q95).

### Diagnosing "AccessDenied" on S3

Three places to check (Q95):

1. IAM identity policy (the principal's permissions).
2. S3 bucket policy (the resource's permissions).
3. KMS key policy (if SSE-KMS).
4. Plus: VPC endpoint policy if going through a gateway endpoint.

---

## 11. Compliance baselines

### Control Tower mandatory + strongly recommended guardrails

- Enable Config in all accounts.
- Enforce CloudTrail in all accounts.
- Disallow public S3 read/write at account level.
- Disallow root user actions and root MFA-disabled.

### CIS / PCI / HIPAA

- Enable **Security Hub standards** for the relevant framework.
- Use **Audit Manager** to gather evidence.
- For HIPAA workloads, ensure **Business Associate Addendum (BAA)** is in place; use only HIPAA-eligible services.

---

## 12. WAF on every ALB - automatic remediation

To guarantee that every ALB in the account has a WAF web ACL:

1. AWS Config rule `alb-waf-enabled`.
2. Configure auto-remediation with SSM Automation document `AWS-AssociateWAFv2WebACL` (Q291).

Alternative with Firewall Manager (org-wide):

- Create a Firewall Manager policy with `Auto remediate any noncompliant resources` -- automatically attaches the policy's web ACL to ALBs (Q8).

---

## 13. Identity Center, SAML federation, ABAC

### Identity Center flow

1. Connect to corporate IdP (Okta/Azure AD/Google) via SAML or SCIM.
2. Define **Permission Sets** (JSON policies).
3. Assign users/groups to accounts with specific permission sets.
4. Users get console + CLI access via the Identity Center portal.

### ABAC with Permission Sets

- Pass session tags from the IdP (e.g., `Team`, `CostCenter`).
- Permission Set inline policy references `aws:PrincipalTag/Team`.
- Resources are tagged accordingly -- a user can only act on resources matching their team tag (Q11, Q160).

### Web Identity Federation for app code

For an internal app that needs S3 access via OIDC (no permanent IAM user):

1. Configure the IdP in IAM Identity Providers (OpenID Connect).
2. Create an IAM role with a trust policy listing the IdP.
3. App calls `AssumeRoleWithWebIdentity` -> gets temporary credentials (Q231).

---

## 14. Decision tree - org-wide compliance enforcement

```text
Need to PREVENT an action across the org?
  -> SCP with Deny + condition (Q26, Q241, Q352)

Need to DETECT and ALERT on a configuration?
  -> AWS Config rule (managed or custom Lambda)
  -> EventBridge on Config compliance change event -> SNS / Lambda (Q96, Q311)

Need to AUTO-FIX a non-compliant resource?
  -> AWS Config remediation action = SSM Automation document (Q13, Q130, Q322)

Need to AUDIT periodically with reports?
  -> Config Aggregator in audit account + Security Hub for cross-service findings (Q67, Q98)

Need to PROVE compliance to auditors?
  -> AWS Audit Manager evidence collection + Security Hub standards

Need to RESTRICT what end users can provision?
  -> Service Catalog products with launch constraints + SCP allow-list of services
```

---

## 15. Common wrong-answer patterns

- Using a **Principal** element in an SCP -- invalid syntax (Q80).
- Using **`aws/s3`** AWS-managed KMS key for cross-account artifact buckets -- cannot grant Decrypt across accounts (Q110).
- Suggesting **"Allow root user with SCP"** -- SCPs don't apply to the management account's root, and cannot grant permissions to root in any account.
- Using **Inspector classic** when modern Inspector v2 covers EC2, ECR, Lambda all in one service.
- Putting Macie on every bucket -- expensive and unnecessary; use **automated discovery exclusions** (Q164).
- Polling CloudTrail for `ConsoleLogin` failures via Lambda -- emit via EventBridge (Q156, Q386).
- Using **identity policy alone** for cross-account S3 access -- need bucket policy too (Q95).

---

## 16. AWS documentation anchors

- [AWS Organizations SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [Cross-account roles tutorial](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html)
- [Config remediation](https://docs.aws.amazon.com/config/latest/developerguide/remediation.html)
- [AWS Config conformance packs](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html)
- [Inspector v2 EC2 scanning](https://docs.aws.amazon.com/inspector/latest/user/scanning-ec2.html)
- [Security Hub auto-enable](https://docs.aws.amazon.com/securityhub/latest/userguide/accounts-orgs-auto-enable.html)
- [Firewall Manager WAF policy](https://docs.aws.amazon.com/waf/latest/developerguide/fms-chapter.html)
- [IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html)

:::note

## Key Takeaway -- Security domain

The exam tests org-level governance fluency: SCP semantics (filter, not grant; no Principal element; deny+condition is the common pattern), StackSets service-managed deployment for baseline resources, Config + remediation for continuous compliance, Security Hub as the aggregation layer, GuardDuty/Inspector/Macie for the actual detection. For runtime security, know IAM cross-account patterns (assume role + trust + KMS CMK), Secrets Manager rotation engines, IMDSv2, Session Manager as bastion replacement, and the layered defenses around S3 (bucket policy + IAM + KMS + VPC endpoint policy).
:::
