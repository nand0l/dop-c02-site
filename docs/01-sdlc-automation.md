# Domain 1 - SDLC Automation

**Source questions covered (93)**: Q3, Q7, Q10, Q14, Q16, Q21, Q23, Q27, Q34, Q41, Q46, Q54, Q56, Q58, Q59, Q64, Q69, Q72, Q74, Q75, Q78, Q82, Q84, Q86, Q87, Q90, Q93, Q97, Q102, Q106, Q121, Q123, Q124, Q125, Q126, Q128, Q129, Q141, Q148, Q178, Q180, Q184, Q186, Q191, Q194, Q199, Q203, Q205, Q210, Q218, Q223, Q224, Q227, Q233, Q234, Q237, Q242, Q248, Q255, Q256, Q262, Q269, Q274, Q275, Q285, Q286, Q287, Q289, Q294, Q298, Q299, Q308, Q312, Q313, Q319, Q320, Q321, Q323, Q324, Q330, Q331, Q336, Q341, Q343, Q347, Q349, Q350, Q357, Q359, Q366, Q375, Q382, Q392.

:::tip 

## Learning Objectives

- Choose the right Code* service for each CI/CD stage: source, build, test, package, deploy.
- Pick the correct CodeDeploy deployment strategy and AppSpec lifecycle hook for EC2, Lambda, and ECS.
- Configure CodePipeline for cross-Region and cross-account deployments.
- Apply ECR scanning, lifecycle policies, and pull-through cache correctly.
- Use EventBridge to react to pipeline, build, and deploy state changes.
- Recognize when SAM/CDK Pipelines simplify Lambda or CDK app deployments.

:::

---

## 1. The Code* service map

| Stage | Primary AWS service | Common alternatives |
| --- | --- | --- |
| Source | CodeCommit, CodeConnections to GitHub/Bitbucket/GitLab | S3 (artifact source), ECR (image source) |
| Build | CodeBuild | EC2-hosted Jenkins (legacy), self-hosted runners |
| Test | CodeBuild + report groups, Device Farm (mobile) | CodeBuild custom phases |
| Package/Artifact | CodeArtifact, ECR, S3 | -- |
| Deploy | CodeDeploy, CloudFormation, SAM, ECS rolling update | Elastic Beanstalk, App Runner |
| Orchestrate | CodePipeline | Step Functions for complex non-CI/CD workflows |
| Notify/React | EventBridge -> SNS/Lambda/Chatbot | -- |

:::warning

## Exam tip - CodeStar is deprecated

If you see "CodeStar Notifications" or "CodeStar Connections" in answer choices, those services have been renamed. CodeStar Connections is now CodeConnections (Q262, Q330). Pure "AWS CodeStar" was retired.
:::

---

## 2. CodeCommit, CodeConnections, and source control

### Triggering pipelines from source

- **CodeCommit -> CodePipeline**: by default CodePipeline creates a CloudWatch/EventBridge rule that fires on `CodeCommit Repository State Change` for the target branch. Do not poll (Q16, Q69).
- **GitHub / Bitbucket via CodeConnections**: webhook-based; no polling. Required for trunk-based development triggers (Q262, Q308, Q330).
- **CodePipeline V2** introduces queued execution mode and Git tag triggers -- use it when overlapping runs would cause duplicate ECR pushes (Q308) or when pull-request and main-branch pipelines must run in parallel (Q349).

### Branch-level permission control

To prevent merges to `main` while allowing pushes to feature branches, attach an IAM **deny** policy with a `aws:ResourceTag` or `codecommit:References` condition on the branch ref. The managed `AWSCodeCommitPowerUser` policy alone allows pushes to any branch (Q125).

### Multi-region DR for CodeCommit

CodeCommit has no built-in cross-Region replication. Use a CodeBuild job triggered on `referenceUpdated` events to push the same commits to a repo in the secondary Region (Q184).

:::warning

## Exam tip - approval signoff trail

A "manual approval" step in CodePipeline records the approver identity in **CloudTrail** (`PutApprovalResult` API). Use CloudTrail + Athena or CloudWatch Logs Insights to audit who approved each production deploy (Q186).
:::

---

## 3. CodeBuild

### Native capabilities (no extra services required)

- **Multiple artifacts per build**: declare `secondary-artifacts` in `buildspec.yml` -- no Lambda or Step Functions needed (Q275).
- **Git history and tagging in builds**: use the `git-credential-helper: yes` setting and CodeBuild Git submodule support. Use native Git to tag commits when tests pass; do not call CodeCommit APIs from Lambda (Q248).
- **Report groups** export JUnit/Cucumber test results to S3 directly via `report-group` config in buildspec (Q178).
- **Local cache for Docker layers** is required to reuse layers across builds; without it, `docker pull` re-downloads base images (Q242).
- **Webhook PR triggers**: CodeBuild can run on PR events from CodeConnections-linked repos without CodePipeline (Q262).

### Secrets in CodeBuild

- Never put `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` as plaintext environment variables. Grant the CodeBuild service role the permissions it needs (Q90).
- Sensitive build parameters: store in **Systems Manager Parameter Store SecureString** or **Secrets Manager** and reference via `parameter-store` / `secrets-manager` env type (Q90).

### ECR authentication from CodeBuild

`aws ecr get-login-password | docker login --username AWS --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com` is the supported pattern (Q78, Q148). `docker login` without an explicit token has been deprecated.

:::warning

## Exam tip - S3 cross-account artifact ACL

When CodeBuild uploads artifacts to an S3 bucket consumed by multiple AWS accounts, the `bucket-owner-full-control` canned ACL is what consumers expect. The `authenticated-read` canned ACL only grants `READ` to any authenticated AWS user -- a likely security failure (Q74).
:::

---

## 4. CodeDeploy strategies and lifecycle hooks

### Strategy comparison

| Strategy | EC2 / on-prem | Lambda | ECS |
| --- | --- | --- | --- |
| In-place | Yes (rolling restart on existing instances) | No | No |
| Blue/green | Yes (new ASG replaces old) | Yes (alias version shift) | Yes (replacement task set) |
| Canary | No (use blue/green) | Yes (`Canary10Percent5Minutes`, `Canary10Percent15Minutes`) | Yes (linear/canary configurations) |
| Linear | No | Yes (`Linear10PercentEvery1Minute` etc.) | Yes |
| AllAtOnce | Yes | Yes | Yes (not recommended for production) |

### AppSpec lifecycle hooks - EC2/on-prem

Order (most-tested):

1. `ApplicationStop`
2. `BeforeInstall` -- typical place to fetch a license, validate config, run pre-install checks (Q121)
3. `Install`
4. `AfterInstall`
5. `ApplicationStart`
6. `ValidateService`

For blue/green: `BeforeBlockTraffic`, `BlockTraffic`, `AfterBlockTraffic` on the original; `BeforeAllowTraffic`, `AllowTraffic`, `AfterAllowTraffic` on the replacement (Q34, Q59).

### AppSpec lifecycle hooks - Lambda

`BeforeAllowTraffic` runs the validation function **before** any traffic is shifted to the new version. `AfterAllowTraffic` runs after 100% shift. Place automated smoke tests in `BeforeAllowTraffic` to abort the shift on failure (Q129).

### AppSpec lifecycle hooks - ECS blue/green

`BeforeInstall`, `AfterInstall`, `AfterAllowTestTraffic`, `BeforeAllowTraffic`, `AfterAllowTraffic`. Use `AfterAllowTestTraffic` to run tests against the green task set on the test listener before shifting production traffic (Q34, Q237).

### Automatic rollback

CodeDeploy rolls back on:

- Deployment failure OR
- A CloudWatch alarm transitioning to ALARM during deployment OR
- A specific deployment status from a lifecycle hook (FAILED).

Wire a CloudWatch metric filter on application error logs to a CloudWatch alarm and configure the deployment group's `autoRollbackConfiguration` to trigger on that alarm (Q285, Q312, Q392). For canary rollback when latency rises, monitor the ALB target group's `TargetResponseTime` (Q312).

:::warning

## Exam tip - in-place vs blue/green decision

Pick **blue/green** when the question mentions: "minimal customer impact", "easy rollback", "test before shifting traffic", "swap CNAME", or "switch a listener rule". Pick **in-place** when the question demands "fewest instances", "lowest cost", or "no new infrastructure".
:::

### CodeDeploy agent troubleshooting

- Skipped lifecycle events almost always mean the **CodeDeploy agent is not running** or cannot reach the deployment group (Q102, Q123).
- Agent logs at `/var/log/aws/codedeploy-agent/codedeploy-agent.log`. Forward these via the CloudWatch agent to centralize (Q333, Q375).
- ALB health check failures during traffic shift typically mean wrong port, wrong path, or grace period too short for application startup (Q123, Q281).

---

## 5. CodePipeline patterns

### Triggering and queueing

- Default: CodePipeline V1 runs sequentially per stage but a new commit *cancels* the in-flight execution. V2 introduces `EXECUTION_MODE = QUEUED` so successive executions queue rather than cancel (Q308).
- `PARALLEL` execution mode in V2 lets a `pull_request` pipeline run concurrent branch executions; `SUPERSEDED` (default V1) cancels in-flight when a new commit arrives (Q349).

### Cross-Region pipelines

CodePipeline requires **an artifact store (S3 bucket) in each Region the pipeline operates in**. Configure `artifactStores` per Region in the pipeline definition. Create the bucket in the target Region before adding the action (Q23).

### Cross-account deployments

Pattern:

1. The pipeline role in account A is granted `sts:AssumeRole` on a deploy role in account B.
2. The S3 artifact bucket in account A uses a bucket policy allowing account B principals to read.
3. The artifact must be encrypted with a **customer-managed KMS key** (not `aws/s3`) so the key policy can grant account B `Decrypt` (Q110, Q347).
4. The CodePipeline action `roleArn` field points at the role in account B.

:::warning

## Exam tip - aws/s3 will not work cross-account

The AWS-managed KMS key `aws/s3` cannot have its key policy modified, so cross-account principals cannot be granted `kms:Decrypt`. Always use a customer-managed CMK for cross-account artifact buckets (Q110).
:::

### Parallel actions in a stage

Within a CodePipeline stage, set the same integer `runOrder` value on multiple actions to run them in parallel. Use this to deploy 5 independent Lambda functions concurrently (Q128).

### Manual approval and external integrations

- A manual approval action can be wired to an SNS topic that subscribes Chatbot, email, or Lambda for Slack/Teams (Q41).
- Pipeline state changes are emitted as EventBridge events (`CodePipeline Pipeline Execution State Change`, `CodePipeline Action Execution State Change`). Subscribe to these for notifications -- do not poll the API every 5 minutes (Q41, Q82, Q282).
- `STARTED`, `SUCCEEDED`, `FAILED`, `CANCELED`, `RESUMED`, `SUPERSEDED` are the action-state values; use `FAILED` to alert on broken builds (Q82).

### Pipeline-as-code

- **AWS SAM** lets you declare CodeDeploy traffic-shifting preferences (e.g., `Canary10Percent15Minutes`) directly on a `AWS::Serverless::Function`, with automatic alias creation, alarms, and pre/post hooks (Q14, Q203).
- **CDK Pipelines** is the recommended pattern for CDK applications and supports built-in unit-test stages via `assertions` module (Q313, Q341).

### Integration testing inside the pipeline

- Add a CodeBuild action between deploy stages to run integration tests; use buildspec phases for setup/run/teardown (Q56, Q180, Q223, Q330).
- For HTTP smoke tests after deploy, the simplest pattern is a Lambda invoke action that calls `PutJobSuccessResult`/`PutJobFailureResult` (Q255, Q289).
- For RDS migration testing, take a snapshot of production, restore to a temporary instance, run tests against the restore, then delete (Q93).
- For resilience testing, configure an **AWS Fault Injection Service (FIS)** action directly in the pipeline -- FIS is a native CodePipeline action provider (Q323).

---

## 6. Container CI/CD: ECR, scanning, Image Builder

### ECR scanning

| Mode | Engine | Behavior |
| --- | --- | --- |
| Basic | Open-source Clair | Scans on push only |
| Enhanced | Amazon Inspector | Continuous scanning, OS + programming-language packages, integrates with Security Hub and EventBridge |

For continuous OS and language vulnerability scanning, **enable Enhanced scanning** -- this is the AWS-recommended path (Q256, Q299, Q320, Q324).

### Pull-through cache

ECR pull-through cache rules transparently cache images from upstream public registries (Docker Hub, ECR Public, Quay, Kubernetes registries). Enables resilience to upstream outages and is faster than re-pulling each build (Q321, Q324). Configure at the **private registry** level, not per repository.

### ECR lifecycle policies

Match images by tag prefix (`tagPrefixList`), tag status (`tagStatus: untagged`), or count/age. Lifecycle policies execute natively inside ECR -- no Lambda needed (Q274, Q366).

### EC2 Image Builder

- Use for **AMI building pipelines** (golden image automation, monthly patch refresh) -- not for application code (Q171, Q227, Q331).
- Image Builder pipelines can be scheduled and can distribute AMIs to other accounts via AWS Organizations sharing.
- For container image hardening, use Image Builder **container recipes** (Q227).
- Store the latest AMI ID in **SSM Parameter Store**, reference it in launch templates via dynamic reference -- this avoids manual launch template updates each month (Q171).

### Approving / rejecting images before deploy

For "reject the image in the manual approval stage if it has critical vulnerabilities":

1. Inspector enhanced scan publishes findings to EventBridge.
2. EventBridge rule on `Inspector2 Finding` triggers Lambda.
3. Lambda calls `PutApprovalResult` to reject the manual-approval action when critical findings exist (Q320).

---

## 7. CodeArtifact

- Supports npm, Maven, PyPI, NuGet, generic. **Semantic versioning** is enforced via package version policies (Q269, Q286).
- Configure **upstream relationships** to a public source (npmjs.org, PyPI). On first request, the package is fetched and cached. Once cached, it is private and outage-resistant (Q269, Q286, Q321).
- **Archiving a vulnerable package version** prevents new downloads while preserving history -- preferred over deletion for audit (Q218).
- Cross-account: dev and prod accounts get separate repositories. EventBridge fires on `CodeArtifact Package Version State Change` to trigger a promotion pipeline in prod (Q319).
- For on-premises CI servers that need to publish to CodeArtifact, use **IAM Roles Anywhere** with a trust anchor (Q210).
- For EC2-based runners pulling from CodeArtifact, the instance profile must have `codeartifact:GetAuthorizationToken`, `sts:GetServiceBearerToken`, and `codeartifact:ReadFromRepository` (Q294).

---

## 8. Deployment strategy decision tree

```text
Need zero downtime AND easy rollback?
|-- Lambda function?
|   |-- Need to test before shifting? -> SAM + CodeDeploy Canary10Percent15Minutes
|   `-- Simple shift -> Linear or AllAtOnce with alias
|-- ECS service?
|   |-- Fargate or EC2 launch type
|   |-- CodeDeploy blue/green via task set + ALB listener swap
|   `-- Use AfterAllowTestTraffic hook for smoke tests on green
|-- EC2 fleet behind ALB?
|   |-- Stateless? -> CodeDeploy blue/green with ASG (new ASG, swap ALB target group)
|   `-- Stateful? -> Externalize state (DynamoDB / ElastiCache) first (Q115)
`-- On-premises or hybrid?
    `-- CodeDeploy in-place with appspec.yml hooks; agent on each host (Q46, Q194)

Need API-level traffic shifting?
|-- REST API behind ALB? -> ALB weighted target groups (no DNS change) (Q343)
`-- REST API in API Gateway? -> Canary deployment on stage (Q86)
```

:::note

## Key Takeaway -- CI/CD service selection

The exam tests *which* AWS service to drop into each pipeline slot, *with what configuration*. When a question lists a hand-rolled solution (cron, polling, custom Lambda gluing services together) next to a native AWS feature (EventBridge rule, SAM traffic-shifting preference, ECR lifecycle policy, report groups), the native feature is almost always the correct answer.
:::

---

## 9. Pipeline observability and rollback

| Goal | Service | Mechanism |
| --- | --- | --- |
| Pipeline state notification | EventBridge -> SNS / Lambda / Chatbot | Native rule on CodePipeline state-change events (Q41, Q82) |
| Build failure notification | EventBridge on CodeBuild state-change | Same (Q234) |
| Rollback on application errors | CloudWatch metric filter -> alarm -> CodeDeploy `autoRollback` | CodeDeploy listens on alarm transitions (Q285, Q312, Q392) |
| Audit who approved a release | CloudTrail `PutApprovalResult` event | Query in Athena or Logs Insights (Q186) |
| Detect slow deploy in ECS | CloudWatch alarm on ALB `TargetResponseTime` | Bound to CodeDeploy via alarm-based rollback (Q312) |

---

## 10. Common wrong-answer patterns in SDLC questions

- Choosing **Jenkins on EC2** when CodeBuild is available -- almost always wrong on "least operational overhead" questions (Q21, Q84).
- Choosing **`docker login` without `get-login-password`** -- deprecated; will fail authentication (Q78).
- Polling pipeline state every N minutes from a scheduled Lambda or EventBridge cron -- always wrong when CodePipeline emits state-change events natively (Q41, Q82, Q282).
- Using **CodeDeploy in-place on production EC2** when the question demands "minimal customer impact" or "easy rollback" -- pick blue/green.
- Manually managing AMI IDs in launch templates instead of referencing SSM Parameter Store (Q171).
- Adding **CodePipeline manual approval webhooks via custom Lambda** when EventBridge -> SNS would do (Q41).
- Using **AWS-managed KMS key (`aws/s3`)** for cross-account artifact buckets (Q110).

---

## 11. AWS documentation anchors cited in source explanations

- [CodeDeploy AppSpec hooks](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html)
- [CodeDeploy + Auto Scaling integration](https://docs.aws.amazon.com/codedeploy/latest/userguide/integrations-aws-auto-scaling.html)
- [CodeDeploy agent troubleshooting](https://docs.aws.amazon.com/codedeploy/latest/userguide/troubleshooting-deployments.html)
- [CodePipeline structure reference (parallel actions)](https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html)
- [CodeCommit + CodeGuru Reviewer](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-amazon-codeguru-reviewer.html)
- [CodeDeploy deployment configurations (Lambda)](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html)

:::note

## Key Takeaway - SDLC domain

Master the CodeDeploy AppSpec hook order for EC2, Lambda, and ECS. Memorize when blue/green is mandatory (Lambda traffic shift, ECS task-set swap, EC2 fleet rollback). Know that EventBridge -- not polling -- is the native trigger for *every* Code* state change. And recognize cross-Region/cross-account pipeline patterns by their three required ingredients: artifact bucket in each Region, customer-managed KMS key, and a deploy role in the target account.
:::
