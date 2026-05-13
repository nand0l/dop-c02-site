# AWS DOP-C02 DevOps Engineer Professional - Synthesis Study Guide

**Source corpus**: 360 exam-style questions (Q1-Q392 with 32 gaps) from the six study-guide parts in this folder.

**Output structure**: One domain-focused deep-dive per file + a cheat-sheet section in each + a final cross-reference index.

---

## How to use this guide

- Each domain file is self-contained: learning objectives, deep-dive content, decision tables, cheat sheets, exam-tip admonitions, and a list of source questions cited.
- Question citations look like `(Q47, Q142, Q322)` and refer to the question numbers in `study-guide-part0X-*.md`.
- AWS documentation URLs from the source explanations are preserved verbatim where they appeared.
- Use the cross-reference index (`99-question-cross-reference.md`) to jump from any question number to the domain section that covers it.

:::tip

## Learning objectives for this index

- Understand the six DOP-C02 exam domains and their approximate weights.
- Map every question in the source corpus to one domain section.
- Identify which AWS services dominate each domain.

:::

---

## DOP-C02 exam domain weights (AWS official)

| # | Domain | Official weight | Questions in corpus |
| --- | --- | --- | --- |
| 1 | SDLC Automation | 22% | 93 |
| 2 | Configuration Management and IaC | 17% | 31 |
| 3 | Resilient Cloud Solutions | 15% | 52 |
| 4 | Monitoring and Logging | 15% | 80 |
| 5 | Incident and Event Response | 14% | 14 |
| 6 | Security and Compliance | 17% | 90 |

:::note

## Corpus skew

Monitoring and Security are over-represented in this corpus relative to official weights. Treat that as a hint about where the practice questions emphasize tricky decisions, not as a reweighting of the actual exam.
:::

---

## Domain files in this synthesis

1. [SDLC Automation](./sdlc-automation) -- CodePipeline, CodeBuild, CodeDeploy, CodeCommit, CodeArtifact, ECR, deployment strategies, blue/green, canary
2. [Configuration Management and IaC](./configuration-management-iac) -- CloudFormation, StackSets, CDK, SAM, Systems Manager, Service Catalog, Image Builder
3. [Resilient Cloud Solutions](./resilient-cloud-solutions) -- Auto Scaling, ALB/NLB, Route 53, multi-Region DR, RPO/RTO, Aurora Global, S3 CRR, Global Accelerator
4. [Monitoring and Logging](./monitoring-and-logging) -- CloudWatch (metrics, logs, alarms, insights, dashboards, RUM, Synthetics), X-Ray, CloudTrail, EventBridge, Kinesis/Firehose
5. [Incident and Event Response](./incident-event-response) -- EventBridge automation, SSM Automation runbooks, Config remediation, SNS/SQS/DLQ patterns
6. [Security and Compliance](./security-compliance) -- IAM, Organizations, SCPs, Control Tower, Config, GuardDuty, Inspector, Macie, Security Hub, Secrets Manager, KMS

---

## Top services by question frequency (entire corpus)

| Rank | Service | Questions mentioning |
| --- | --- | --- |
| 1 | Lambda | 160 |
| 2 | EC2 | 151 |
| 3 | S3 | 120 |
| 4 | EventBridge | 101 |
| 5 | CloudWatch | 97 |
| 6 | IAM | 88 |
| 7 | CloudFormation | 73 |
| 8 | CodePipeline | 60 |
| 9 | Organizations | 60 |
| 10 | Auto Scaling | 57 |
| 11 | Systems Manager | 57 |
| 12 | CloudWatch Logs | 54 |
| 13 | SNS | 51 |
| 14 | AWS Config | 49 |
| 15 | CodeBuild | 47 |
| 16 | CodeDeploy | 45 |
| 17 | CloudTrail | 44 |
| 18 | ALB | 39 |
| 19 | Route 53 | 29 |
| 20 | CloudWatch Alarms | 27 |

:::warning

## Exam tip - the "glue services"

EventBridge, Lambda, SNS, and SQS appear across nearly every domain. The exam tests whether you know the *right* glue service for each scenario: EventBridge for event routing and cross-account fan-out, SNS for fan-out notifications, SQS for buffering and DLQs, Lambda for transform/automation logic. Misuse of these glue services is the single most common wrong-answer pattern.
:::

---

## Reading order recommendation

1. Start with [Security and Compliance](./security-compliance) and [SDLC Automation](./sdlc-automation) -- highest weight, most questions.
2. Then [Monitoring and Logging](./monitoring-and-logging) and [Resilient Cloud Solutions](./resilient-cloud-solutions) -- heavy overlap; CloudWatch alarms drive Auto Scaling, etc.
3. Then [Configuration Management and IaC](./configuration-management-iac) -- CloudFormation patterns appear inside SDLC, Security, and Resilience answers.
4. Finish with [Incident and Event Response](./incident-event-response) -- shortest, but the patterns there reinforce the rest.

---

## Conventions used in every domain file

- `:::tip Learning Objectives` block at the top of each section.
- `:::warning Exam Tip` for must-know gotchas.
- `:::note Key Takeaway` to close major sections.
- ASCII only -- no smart quotes, em dashes, or ellipsis characters.
- Question citations inline: `(Q1, Q47, Q142)`.
- AWS doc URLs in plain text, preserved from source explanations.
