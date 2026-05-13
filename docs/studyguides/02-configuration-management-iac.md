# Domain 2 - Configuration Management and Infrastructure as Code

**Source questions covered (31)**: Q18, Q22, Q24, Q39, Q51, Q68, Q76, Q83, Q89, Q92, Q119, Q120, Q140, Q150, Q170, Q185, Q187, Q188, Q215, Q221, Q235, Q247, Q259, Q265, Q272, Q279, Q297, Q335, Q344, Q351, Q372.

(Many additional questions in other domains rely on CloudFormation, CDK, and Systems Manager; treat this domain as a toolset cross-referenced from SDLC, Security, and Resilience.)

:::tip

## Learning Objectives

- Choose between CloudFormation, CDK, SAM, Terraform, and Service Catalog for a given scenario.
- Use the right CloudFormation feature: change sets, drift detection, nested stacks, StackSets, custom resources, macros, `cfn-init`/`cfn-signal`, deletion/update/creation policies.
- Apply Systems Manager (SSM) correctly: Parameter Store, State Manager, Automation, Run Command, Session Manager, Patch Manager.
- Manage configuration distribution with AppConfig and Service Catalog.

:::

---

## 1. IaC service map

| Need | Service |
| --- | --- |
| Declarative AWS resources | CloudFormation |
| Code-first IaC in TypeScript/Python/Java/Go | AWS CDK (synthesizes to CloudFormation) |
| Serverless app templates with shortcuts | AWS SAM (CloudFormation transform) |
| Cross-account / cross-Region deployment of templates | CloudFormation StackSets |
| Productized templates for end users | AWS Service Catalog |
| AMI / container-image creation pipelines | EC2 Image Builder |
| Configuration values for application code | AWS AppConfig |
| Secrets used at runtime | Secrets Manager |
| Hierarchical key/value config | SSM Parameter Store |
| Imperative config on running instances | SSM State Manager + Run Command |
| Multi-account guardrails | AWS Control Tower + Organizations |
| Customizations for Control Tower (CfCT) | CloudFormation + Service Catalog + CodePipeline |

---

## 2. CloudFormation core features

### Lifecycle policies

| Property | Where | What it does |
| --- | --- | --- |
| `CreationPolicy` | EC2, ASG, WaitCondition | Waits for `cfn-signal` from the resource before considering creation complete (Q24, Q39) |
| `UpdatePolicy` | ASG, Lambda alias, ElastiCache, OpenSearch | Controls rolling/replacement update behavior (Q39) |
| `DeletionPolicy` | Any resource | `Retain`, `Snapshot`, `Delete` (default). Use `Snapshot` on RDS/EBS to keep data after stack deletion (Q22) |
| `UpdateReplacePolicy` | Any resource | Applies when an update would replace the resource -- mirror of DeletionPolicy semantics (Q22) |

### Helper scripts on EC2 user data

- `cfn-init`: applies `AWS::CloudFormation::Init` metadata blocks (packages, files, services).
- `cfn-signal`: signals success/failure back to the stack so the `CreationPolicy` resolves.
- `cfn-hup`: long-running daemon that watches the EC2 metadata for stack updates and re-runs `cfn-init` if templates change (Q120).

### Change sets

Always preview infrastructure changes in production with a **change set**. CodePipeline integrates: `CREATE_CHANGE_SET` action -> manual approval -> `EXECUTE_CHANGE_SET` action (Q58, Q221).

### Nested vs. parent stacks

- Use **nested stacks** (`AWS::CloudFormation::Stack`) to compose reusable building blocks within one root stack.
- Use **cross-stack references** (`Export`/`!ImportValue`) when stacks must remain independently deployable but share resource ARNs.
- Use **StackSets** when the same template must run in many accounts or Regions.

### Drift detection

- Manual: `aws cloudformation detect-stack-drift`.
- Automatic: AWS Config managed rule `CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK` evaluates drift continuously and can trigger SSM Automation remediation or SNS notifications (Q311).

### Macros and custom resources

- **Macros** transform a template at deploy time (e.g., loops, conditionals). They run a Lambda before stack create/update.
- **Custom resources** (`AWS::CloudFormation::CustomResource` or `AWS::Lambda::Function` backed) let you call any AWS API from inside the stack lifecycle. Use them for things CloudFormation cannot do natively (e.g., enable an external service, run a one-time script) (Q108, Q187).

### Stack policies

A **stack policy** is JSON, attached to a stack, that prevents updates to specified resources. Use to protect production databases from accidental replacement (different from IAM policy).

:::warning

## Exam tip - stack failure cleanup

The default `OnFailure` for a new stack is `ROLLBACK`. To debug, set `OnFailure: DO_NOTHING` (or `--disable-rollback`) so you can inspect resources that were created before the failure (Q22, Q92). CloudFormation now also supports `--retain-except-on-create` to retain specific failed resources.
:::

---

## 3. CloudFormation StackSets

| Permission model | Use when |
| --- | --- |
| Self-managed | Target accounts already exist outside Organizations; you manually create the execution and admin roles |
| Service-managed | Org Master deploys via Organizations integration; uses the `AWSCloudFormationStackSetsOrgAdminRole` and the per-account `AWSCloudFormationStackSetsOrgMemberRole` |

For automated rollouts to *new* accounts joining an OU, use service-managed StackSets with **auto-deployment** enabled. The stack instance is created automatically on the new account (Q30, Q63, Q66).

Common patterns covered in source questions:

- Org-wide CloudTrail organization trail + SNS topic + EventBridge rule for failed logins -> use StackSets to deploy the EventBridge rule and SNS topic in every account (Q30, Q363).
- Org-wide Config rules + remediation: better done with **Config Conformance Packs** or **Config aggregator** (Q67).
- Org-wide tagging policy: use **Organizations tag policies**, not StackSets (Q145).

---

## 4. AWS CDK

- CDK synthesizes language-defined infrastructure to a CloudFormation template (Q313, Q341).
- **CDK Pipelines** is a self-mutating pipeline construct -- it updates its own pipeline definition when the CDK source changes (Q341).
- Unit-test the synthesized template using the `assertions` module: assert resources, properties, and counts after `app.synth()` (Q313, Q341).
- For multi-Region deploys, set the `env` property on each stack with explicit `region`/`account` -- CDK does not auto-detect.

---

## 5. AWS SAM

- A CloudFormation transform (`Transform: AWS::Serverless-2016-10-31`) that adds resource types (`AWS::Serverless::Function`, `AWS::Serverless::Api`, `AWS::Serverless::StateMachine`).
- **Traffic-shifting preferences** integrate with CodeDeploy: `Canary10Percent15Minutes`, `Linear10PercentEvery1Minute`, `AllAtOnce`. SAM auto-creates the Lambda alias and CodeDeploy resources (Q14, Q203, Q298).
- Use `PreTraffic` and `PostTraffic` hook Lambda properties to gate the traffic shift (Q14).

---

## 6. AWS Service Catalog

- **Portfolio** = collection of products. **Product** = version of a CloudFormation template. **Constraint** = launch role / tag / template parameter overrides.
- Use to provide a **self-service catalog** to end users who do not have direct CloudFormation permissions. The launch constraint controls the IAM role used during provisioning, so the consumer never needs underlying-service permissions.
- Service Catalog is the right answer when a question mentions "limit which resource configurations end users can deploy" or "standardize provisioned resources" (Q48, Q259, Q372).

---

## 7. Customizations for Control Tower (CfCT)

- A pre-built solution that extends Control Tower with **CloudFormation templates + Service Catalog products + CodePipeline** managed via Organizations.
- Deploys account customizations whenever an account is added to an OU.
- Correct answer when the scenario says: Control Tower landing zone + "automate baseline resources in new accounts" + "version-controlled templates" (Q48, Q357).

---

## 8. Systems Manager (SSM) capabilities

| Capability | What it does | Exam-relevant use |
| --- | --- | --- |
| Parameter Store | Hierarchical config + SecureString | Store DB endpoints, AMI IDs, config values; reference in CloudFormation and Lambda (Q44, Q171, Q198) |
| Secrets Manager | Encrypted secrets with rotation | Use **for credentials that need rotation** (RDS, Redshift, DocumentDB, custom Lambda rotation) (Q77, Q90, Q105, Q287, Q359) |
| Run Command | Execute scripts on managed instances | Used by Automation; can target by tag |
| State Manager | Continuously enforce a configuration | Use to keep instances joined to an AD domain (Q162) |
| Automation | Predefined or custom runbooks (YAML/JSON documents) | Patch, restart, remediate -- triggered by EventBridge, schedules, or Config (Q70, Q207, Q209, Q309, Q322) |
| Session Manager | Browser/CLI shell into instances without SSH/RDP | Replaces bastion hosts; sessions logged to CloudTrail + CloudWatch Logs |
| Patch Manager | Patch baselines + maintenance windows + scan/install | Custom baselines for compliance environments (Q33) |
| OpsCenter | Aggregated operational issues | Often used with EventBridge as the target for Config non-compliance |
| Incident Manager | Response plans, runbooks, escalation | Pair with CloudWatch alarm composite alarms |
| Inventory | Software inventory across managed instances | Audit licensed software placement (Q183) |

### Hybrid Activations

Managed (on-premises or VM) instances are registered via **Hybrid Activations**. They show up as `mi-*` IDs in Systems Manager and can be patched with Patch Manager the same way as EC2 (Q47, Q136).

### Parameter Store vs Secrets Manager

| Feature | Parameter Store | Secrets Manager |
| --- | --- | --- |
| Cost | Free for standard tier; advanced tier paid | Always paid per-secret + API calls |
| Native rotation | No (custom only) | Yes (managed for RDS, Redshift, DocumentDB; Lambda template for others) |
| Cross-region replication | No (manual) | Yes (replica secrets) |
| Resource-based policy | Only on advanced tier | Yes |
| Max value size | 4 KB standard / 8 KB advanced | 64 KB |

Pick **Secrets Manager** when rotation, replication, or larger payloads are required (Q77, Q105). Pick **Parameter Store** for non-secret config like AMI IDs and feature flags (Q44, Q171, Q198).

### AppConfig (part of Systems Manager)

- Use for **feature flags and dynamic configuration** delivered to running applications without redeploying.
- Supports validation, deployment strategies (canary), and integration with CloudWatch alarms for automatic rollback of bad config (Q343).

---

## 9. Choosing between IaC tools - decision tree

```text
Need to deploy AWS infrastructure across many accounts?
  -> CloudFormation StackSets (service-managed if in Organizations)

Just one account, serverless app?
  -> SAM (it is CloudFormation + sugar for Lambda/API GW)

Engineers prefer code (TypeScript/Python) over YAML?
  -> CDK (synthesizes to CloudFormation, gives full power)

Need to package templates for non-engineers to launch?
  -> Service Catalog with launch constraint

Need monthly AMI builds?
  -> EC2 Image Builder

Need to push config to running EC2 fleet?
  -> SSM State Manager + Automation runbooks (or AppConfig for app-level)

Need to bootstrap Windows/Linux laptops with code from GitHub?
  -> SSM Document with aws-downloadContent plugin (sourceType: GitHub) (Q224)
```

---

## 10. CloudFormation gotchas commonly tested

- **`DeletionPolicy: Retain` vs `Snapshot`** -- choose `Snapshot` for RDS/EBS when you want to recover but not keep the resource (Q22, Q272).
- **Hard-coded subnet/AMI IDs** make a template Region-locked. Use `AWS::SSM::Parameter::Value<...>` references (Q171).
- **Stack updates that replace a resource** force downtime; check the "Update requires" column in AWS docs.
- **Custom resource Lambdas** must call `cfnresponse.send(...)` or the stack hangs for the timeout duration.
- **`Outputs` and `Exports`** are scoped per-Region; cannot be referenced across Regions.
- **StackSets concurrency** is `MAX_CONCURRENT_PERCENTAGE/COUNT` -- tune to avoid throttling target accounts.
- **Service-linked roles** created by StackSets are not deleted on stack deletion (Q235).

:::warning

## Exam tip - drift detection vs Config

CloudFormation **drift detection** runs on demand and reports resource-level drift inside one stack. AWS **Config + CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK** runs continuously across all stacks and produces compliance findings that can trigger SSM Automation remediation. When the question wants "continuous, automated" drift handling, pick Config (Q311).
:::

---

## 11. AppConfig flow

1. Create an **Application** (logical container).
2. Create an **Environment** (e.g., prod, staging).
3. Create a **Configuration Profile** (where the config lives: Parameter Store, S3, hosted in AppConfig).
4. Define **Validators** (JSON schema or Lambda).
5. Define a **Deployment Strategy** (canary, linear, all-at-once).
6. Start a deployment; configure CloudWatch alarms for automated rollback on bad config (Q343).

Applications retrieve config via `GetLatestConfiguration` API; the AppConfig agent or Lambda extension caches it locally.

---

## 12. Recommendation patterns

| Scenario | Recommended IaC tool |
| --- | --- |
| Lambda + API Gateway + DynamoDB serverless app | SAM |
| Multi-stack TypeScript application across 3 Regions | CDK + CDK Pipelines |
| Same template to every account in OU on creation | Service-managed StackSets with auto-deployment |
| End users provisioning sandbox EC2 with hardened AMI | Service Catalog product with launch constraint |
| Monthly hardened AMI refresh distributed across OUs | EC2 Image Builder pipeline + SSM Parameter Store for the AMI ID |
| Detect and revert manual stack changes | Config drift rule + SSM Automation remediation |
| Centrally manage 1000+ EC2 instances' configuration | SSM State Manager associations |
| Rotate RDS password every 30 days | Secrets Manager managed rotation |

:::note

## Key Takeaway -- IaC domain

The exam constantly mixes CloudFormation primitives (change sets, StackSets, drift, custom resources, helper scripts, deletion policies) with SSM primitives (Parameter Store, Automation, State Manager, Hybrid Activations, AppConfig). Know which feature lives in which service, and recognize that "service-managed StackSets + auto-deployment" is almost always the right answer for org-wide rollouts.
:::
