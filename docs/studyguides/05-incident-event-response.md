# Domain 5 - Incident and Event Response

**Source questions covered (14)**: Q4, Q13, Q30, Q70, Q88, Q116, Q130, Q207, Q226, Q252, Q306, Q309, Q311, Q322.

(Most "respond to" patterns are also indexed under Monitoring -- this domain focuses on the automated-remediation and runbook side.)

:::tip

## Learning Objectives

- Build event-driven remediation: detect a non-compliant resource, apply a corrective action automatically.
- Choose between AWS Config remediation, EventBridge + Lambda, EventBridge + SSM Automation, and Step Functions.
- Use Dead Letter Queues (DLQs) and redrive policies to handle message-processing failures.
- Apply Systems Manager runbooks (Automation, State Manager) for deterministic incident response.
- Combine AWS Health events with EventBridge for proactive maintenance handling.

:::

---

## 1. The four flavors of automated remediation

| Trigger source | Action runner | Best for |
| --- | --- | --- |
| AWS Config rule -> remediation action | SSM Automation document | Compliance drift on a known resource attribute (Q4, Q13, Q130, Q226, Q322) |
| EventBridge rule on service event | Lambda or SSM Automation | Reactive remediation when a specific API call or service event fires (Q17, Q42, Q207, Q309) |
| CloudWatch alarm | Auto Scaling action, EC2 recovery, SNS, SSM Automation | Numeric threshold remediation (e.g., restart unhealthy host) (Q70, Q204, Q337) |
| Scheduled (EventBridge Scheduler) | Lambda, SSM Automation | Daily cleanup tasks (e.g., delete files, snapshot EBS) (Q138, Q309) |

### Config-driven remediation flow

1. AWS Config records a configuration change for a resource.
2. A Config managed or custom rule evaluates the resource -> `COMPLIANT` or `NON_COMPLIANT`.
3. If `NON_COMPLIANT`, Config invokes the **remediation action** (an SSM Automation document) with the non-compliant resource ID as input.
4. The runbook attaches the missing IAM instance profile, deletes the open SSH rule, enables EBS encryption, etc.

Example: `ec2-instance-profile-attached` Config managed rule + an SSM Automation document that attaches a default instance profile -> remediates every new EC2 instance launched without an instance profile (Q13, Q322).

Example: `s3-bucket-server-side-encryption-enabled` + SSM remediation that enables SSE on the bucket (Q130).

### EventBridge-driven remediation flow

1. The event source (CloudTrail, AWS Health, GuardDuty, Inspector, etc.) emits an event.
2. An EventBridge rule matches by `source`, `detail-type`, and event-specific fields.
3. Target: Lambda for code-based remediation, SSM Automation for prebuilt runbooks, or both.

Example: AWS Health `instance-retirement` event -> SSM Automation that drains the instance, snapshots EBS, stops/starts to migrate hardware, and tags it as "remediated" (Q207, Q334).

Example: CreateVolume API in CloudTrail -> EventBridge -> Lambda that ensures the EBS volume has the required `backup_frequency` tag, defaulting to `weekly` (Q4).

:::warning

## Exam tip - Config remediation vs EventBridge

Use **Config remediation** when the requirement is "ensure resources stay compliant over time" -- Config periodically re-evaluates and can re-remediate.

Use **EventBridge + Lambda/SSM** when the requirement is "react immediately to a specific API call or event" -- it is push-based and faster, but only fires once per event.

Some questions accept both (Q4); pick the one that better matches the wording about *continuous compliance* vs *one-time reaction*.
:::

---

## 2. SSM Automation runbooks (Automation documents)

### Document types

- **AWS-owned**: e.g., `AWS-RestartEC2Instance`, `AWS-StopEC2Instance`, `AWSSupport-TroubleshootEKSWorkerNode`, `AWS-AttachIAMToInstance`.
- **Custom**: YAML/JSON written by you; supports steps for Run Command, Lambda invoke, Step Functions, branch/loop.

### State Manager vs Automation

| Feature | State Manager | Automation |
| --- | --- | --- |
| Continuous enforcement | Yes (cron-like schedule) | No (one-shot) |
| Drift detection | Yes (re-applies association) | No |
| Branching/looping | Limited | Yes |
| Typical use | Keep instances domain-joined, install agents | Multi-step remediation, troubleshooting (Q252) |

State Manager **associations** repeatedly apply an SSM document on a target (e.g., every 30 minutes the instance is verified to be running the CloudWatch agent and joined to AD) (Q162).

For deletion of files daily across many EC2 instances with notification, **State Manager Automation document** orchestrates the steps and SNS publishes the notification on success/failure (Q309).

### AWSSupport-* runbooks

AWS maintains support runbooks for common troubleshooting:

- `AWSSupport-TroubleshootEKSWorkerNode` -- diagnoses why managed nodes fail to join the cluster (Q252).
- `AWSSupport-TroubleshootSSHConnection` -- checks SG, NACL, agent connectivity.
- `AWSSupport-TroubleshootCodeDeployDeployments` -- standard CodeDeploy issue checks.

---

## 3. Org-wide notification fan-out (StackSets pattern)

To ensure every account in an organization notifies SecOps on a specific event (e.g., root user login):

1. Build a CloudFormation template that creates: SNS topic (subscribed to SecOps email) + EventBridge rule matching the event.
2. Deploy via **service-managed StackSets** with auto-deployment enabled -- new accounts joining the OU receive the rule automatically (Q30).

This pattern is much simpler than centralizing events and avoids cross-account EventBridge permissions.

For *aggregating* events into a single audit-account bus (rather than sending notifications per account), use **cross-account event bus permissions** (Q303) -- see Monitoring domain.

---

## 4. Message-handling resilience (SNS, SQS, DLQ)

### SNS -> Lambda with retry

- SNS triggers Lambda asynchronously. Lambda async invocation has **2 retries** by default with exponential backoff.
- Configure an **on-failure destination** (typically SQS DLQ) on the Lambda function. After retries are exhausted, Lambda sends the failed event to the DLQ for inspection and reprocessing (Q116, Q144).

### SQS DLQ pattern

- Configure `RedrivePolicy` on the source queue with `maxReceiveCount` and `deadLetterTargetArn`.
- A message that fails to be processed N times moves to the DLQ.
- Operators inspect the DLQ, fix the cause, and redrive (manually with `StartMessageMoveTask` or via console) (Q38).

### Lambda + Kinesis poison-record handling

- Set **`BisectBatchOnFunctionError = true`** so Lambda splits the batch and retries each half, isolating the bad record.
- Set **`MaximumRetryAttempts`** to a finite value.
- Configure an **`OnFailure` destination** so the offending records and their metadata go to SQS or SNS for offline analysis (Q106, Q175).

---

## 5. AWS Health + EventBridge

AWS Health publishes events for:

- Scheduled changes (EC2 instance retirements, RDS maintenance, EBS volume issues).
- Account notifications (limit increases, deprecations).
- Public events (service disruptions in a Region).

EventBridge pattern:

```json
{
  "source": ["aws.health"],
  "detail-type": ["AWS Health Event"],
  "detail": { "service": ["EC2"], "eventTypeCategory": ["scheduledChange"] }
}
```

Target: SSM Automation runbook (e.g., `AWS-RestartEC2Instance`) gated to run only inside a **maintenance window**. Without the maintenance window, the action fires immediately when the Health event lands, which violates the requirement (Q20, Q207, Q334).

For broader operations notifications -- pending EC2 maintenance, deprecated AMIs -- subscribe **AWS Chatbot** (Slack/Teams) to an SNS topic that EventBridge fans out to (Q117).

---

## 6. CloudFormation drift remediation

Manual modification of stack-created resources causes drift, which often breaks the next stack update. Detect and respond:

1. **AWS Config managed rule** `CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK` flags drifted stacks continuously.
2. Config emits a `Config Rules Compliance Change` event on `NON_COMPLIANT`.
3. EventBridge target sends an SNS notification to the DevOps lead (Q311).

Alternative: scheduled Lambda calling `DetectStackDrift` then `DescribeStackResourceDrifts` -- works, but more operational overhead than the Config rule.

---

## 7. Data integrity in incident response

When migrating data to S3 incrementally and you must catch silent corruption:

- Send the **Content-MD5** header with `PutObject`. S3 calculates the checksum of the received body and rejects with `BadDigest` if it does not match (Q88).
- For very large objects, use **trailing checksums** with `PUT` and one of `CRC32`, `CRC32C`, `SHA1`, `SHA256`.

---

## 8. Incident Manager (Systems Manager)

- **Response plans** group: contact channels (SMS/voice/email), escalation chains, runbooks (SSM Automation), and chat channels.
- **Composite CloudWatch alarms** can be the incident trigger; Incident Manager opens an incident and starts the response plan automatically.
- Integrates with Slack via AWS Chatbot.

Not commonly tested in this corpus, but recognize it when "automated incident response with on-call paging and a runbook" appears in answer choices.

---

## 9. Decision tree - "which automation pattern"

```text
Is the trigger a service-emitted event (API call, finding, health alert)?
  Yes -> EventBridge rule
    -> Need to run multi-step playbook? Target: SSM Automation document
    -> Need to run custom code? Target: Lambda
    -> Need to notify only? Target: SNS topic (with Chatbot subscriber for Slack/Teams)

Is the trigger "this resource is non-compliant for N minutes"?
  Yes -> AWS Config rule with remediation action (SSM Automation as runner)

Is the trigger "this metric crossed a threshold"?
  Yes -> CloudWatch alarm
    -> EC2-level fix? Action: EC2 recovery (StatusCheckFailed_System) or stop/start
    -> Need a notification or workflow? Action: SNS or SSM Automation via EventBridge

Is the trigger "every day at 2 AM"?
  Yes -> EventBridge Scheduler -> Lambda or SSM Automation

Is the issue "messages are stuck and being retried forever"?
  Yes -> DLQ (SQS) with redrive policy / Lambda on-failure destination
```

---

## 10. Common wrong-answer patterns

- Using a **custom scheduled Lambda** to poll AWS Config compliance state -- Config emits the change event natively to EventBridge.
- Skipping the **maintenance window** when responding to AWS Health events -- the question may forbid immediate action (Q334).
- Choosing **no DLQ** for an event-driven Lambda when the question mentions "must not lose messages" (Q38, Q116, Q144).
- Picking **State Manager** for one-time tasks -- State Manager is for continuous enforcement; Automation is for one-off (Q252, Q309).
- Bouncing an EventBridge event through SNS solely to trigger Lambda -- EventBridge can target Lambda directly.

:::warning

## Exam tip - look for the maintenance window

When the question mentions "maintenance window" or "after business hours only", the answer must include an SSM **Maintenance Window** wrapping the Automation, or a State Manager schedule, not a direct EventBridge -> Automation invocation that fires immediately (Q20, Q334).
:::

---

## 11. AWS documentation anchors

- [AWS Config remediation](https://docs.aws.amazon.com/config/latest/developerguide/remediation.html)
- [SSM Automation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html)
- [EventBridge AWS Health](https://docs.aws.amazon.com/health/latest/ug/cloudwatch-events-health.html)
- [Lambda async invocation destinations](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html)
- [SQS DLQ](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)

:::note

## Key Takeaway -- Incident response domain

Map every reactive question to one of three engines: **EventBridge** (push, event-driven), **Config** (continuous compliance), **CloudWatch alarm** (metric threshold). Pair each with the right runner: Lambda for code, SSM Automation for multi-step runbooks, EC2 recovery for hardware-level issues. And recognize that DLQs are the only correct answer when the question fears message loss.
:::
