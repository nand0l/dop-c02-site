# Domain 4 - Monitoring and Logging

**Source questions covered (80)**: Q1, Q17, Q20, Q28, Q31, Q32, Q35, Q44, Q45, Q47, Q55, Q60, Q62, Q71, Q96, Q99, Q100, Q103, Q113, Q117, Q127, Q134, Q138, Q142, Q143, Q146, Q147, Q149, Q156, Q159, Q163, Q167, Q168, Q173, Q175, Q189, Q196, Q209, Q220, Q225, Q239, Q240, Q244, Q246, Q253, Q257, Q261, Q264, Q276, Q280, Q282, Q283, Q290, Q293, Q301, Q302, Q303, Q310, Q315, Q317, Q318, Q326, Q333, Q334, Q337, Q340, Q345, Q353, Q355, Q356, Q363, Q368, Q371, Q380, Q381, Q383, Q386, Q387, Q389, Q391.

:::tip

## Learning Objectives

- Choose the right CloudWatch tool for each scenario: metric filters, Logs Insights, dashboards, alarms, anomaly detection, Contributor Insights, RUM, Synthetics, embedded metric format.
- Distinguish CloudTrail (API auditing) from CloudWatch (operational metrics) from AWS Config (configuration history).
- Use EventBridge correctly: default vs custom event buses, cross-account event sharing, schema registry, input transformers.
- Stream logs to S3 / OpenSearch / Splunk via subscription filters + Kinesis Data Streams / Firehose.
- Centralize logs and audit trails across many accounts using organization trails and Config aggregators.

:::

---

## 1. The CloudWatch toolset

| Tool | Best for | Common wrong answer |
| --- | --- | --- |
| Metrics (standard + custom) | Time-series numerical data, alarms, dashboards | Trying to alarm on raw log lines |
| CloudWatch Logs | Centralized log storage from EC2, Lambda, ECS, services | Storing logs in S3 from day one (less searchable) |
| Metric filters | Convert log patterns into a metric with dimensions | Using Logs Insights to *automate* metric creation (Insights is interactive only -- Q1) |
| Logs Insights | Interactive ad-hoc log queries | Using Insights to drive alarms or dashboards continuously |
| Alarms | Static, anomaly, composite alarms; alarm targets EC2 recovery, SNS, Auto Scaling | Polling metrics from Lambda |
| Dashboards | Visualizing metrics + log queries | -- |
| Anomaly detection | ML-based alarms on baseline drift (Q168) | Static thresholds on noisy metrics |
| Contributor Insights | Top-N analysis on log fields (top IPs, top error codes) | -- |
| Embedded Metric Format (EMF) | Push metrics inside log lines from Lambda/containers without API calls | Calling `PutMetricData` in tight loop |
| Synthetics | Canary scripts to test endpoint availability and UX | Lambda + Cron + custom CloudWatch Put (Q149) |
| RUM (Real User Monitoring) | Real-user browser performance and JS errors (Q380) | Estimating client-side performance from server metrics |
| Container Insights | Auto-instrumented metrics + logs for ECS/EKS/Fargate (Q246, Q315, Q355, Q371) | Hand-rolled Prometheus |
| Lambda Insights | Detailed Lambda runtime metrics (CPU, memory, network) | -- |
| Metric Streams | Continuous near-real-time push of all metrics to S3/Firehose/Kinesis (Q381) | API polling |

---

## 2. Metric filter vs Logs Insights query (the most-tested distinction)

| | Metric filter | Logs Insights |
| --- | --- | --- |
| Mode | Continuous, on every log event | On-demand interactive query |
| Output | A CloudWatch metric (time series) | Result rows in console |
| Triggers alarms | Yes | No (you can save queries to dashboards but not alarms continuously) |
| Use for | "Count of failed logins per minute" | "Show me which IPs caused errors last hour" |

Both can parse JSON. Metric filter syntax `{$.field = "value"}` matches a JSON path; Logs Insights uses SQL-like syntax with `parse`, `filter`, `stats`.

:::warning

## Exam tip - if the requirement is "alarm" or "ongoing metric"

Always pick metric filters, not Logs Insights, for ongoing measurement (Q1, Q31, Q55, Q113, Q156, Q317, Q326, Q386). Logs Insights is only correct for "investigate", "find which user", or "ad-hoc" wording (Q196).
:::

---

## 3. CloudWatch agent vs older agents

| Agent | Status | Capabilities |
| --- | --- | --- |
| **CloudWatch agent** (unified) | Current | Logs + custom metrics (CPU, memory, disk, custom apps), procstat, StatsD/collectd ingestion |
| Legacy "awslogs" agent | Deprecated | Logs only (older Linux AMIs) |
| ECS `awslogs` log driver | Current | Logs from containers using the Docker awslogs driver |

To collect memory utilization, disk usage, or any custom metric from EC2 you **must install the CloudWatch agent** (Q261, Q318, Q387). Default EC2 monitoring does not include memory or disk.

For Kubernetes:

- Install via the **CloudWatch Observability EKS add-on** for Container Insights, with IRSA on the service account (Q246, Q371).
- For EC2-launch-type ECS, the **container instance IAM role (ecsInstanceRole) must trust the EC2 service** to assume the role; the ECS agent then pushes logs (Q353, Q387).

---

## 4. Subscription filters and log streaming

CloudWatch Logs **subscription filters** stream logs in near-real-time to:

- AWS Lambda
- Amazon Kinesis Data Streams
- Amazon Data Firehose (formerly Kinesis Data Firehose)

Subscription filters **cannot** stream directly to S3 or OpenSearch (Q103, Q175, Q383).

| Destination | Pipeline |
| --- | --- |
| S3 long-term archive | Subscription filter -> Firehose -> S3 |
| OpenSearch / Elasticsearch | Subscription filter -> Lambda transform -> OpenSearch (or via Firehose with OpenSearch destination) |
| Real-time analytics | Subscription filter -> Kinesis Data Streams -> Lambda / KCL consumer |
| Centralized account | Subscription filter (cross-account) -> destination in audit account |

To export historical logs once (not streaming), use **CloudWatch Logs export to S3** task.

For Network Firewall flow logs that need transformation before Athena query, **send the flow logs to Firehose with a Lambda transformer**, output to S3 (Q276).

---

## 5. CloudWatch alarms

### Alarm types

| Type | Trigger |
| --- | --- |
| Static | Threshold breached for N out of M data points |
| Anomaly detection | Value outside expected band based on ML model (Q168) |
| Composite | Logical combination (AND/OR) of multiple alarms |

### Common alarm patterns

- **EC2 instance recovery on `StatusCheckFailed_System`** -- the alarm action is the recovery, no Lambda needed (Q45, Q337).
- **Auto Scaling driven by SQS backlog** -- target tracking on a *metric math* expression that divides `ApproximateNumberOfMessagesVisible` by running task count (Q283, Q293).
- **Alarm + CodeDeploy auto-rollback** -- declare the alarm in `autoRollbackConfiguration` (Q285, Q312, Q392).
- **Stop EC2 instances when idle** -- alarm on `NetworkPacketsIn`, action = Stop (Q167).
- **Composite alarm for "any of these 5 alarms"** to avoid alert storms.

### Detailed monitoring

Switching EC2 from **basic** (5-minute) to **detailed** (1-minute) monitoring is the first step when the team needs faster alarms on traffic spikes (Q380).

---

## 6. EventBridge

### Event bus types

| Bus | Source |
| --- | --- |
| Default | All AWS service events in the account |
| Custom | Application emits via `PutEvents` |
| Partner | SaaS partner integrations (Auth0, Datadog, etc.) |

### Event patterns

EventBridge rules match JSON event patterns. Use `detail-type`, `source`, and `detail.<field>` to filter. Use **input transformers** to reshape the matched event before delivery (Q96).

### Cross-account event sharing

To send events from many accounts to one central bus:

1. Resource-based policy on the **destination event bus** allowing source accounts to `events:PutEvents`.
2. Rule in each source account whose target is `arn:aws:events:<region>:<dest-acct>:event-bus/default` (or a custom bus name) (Q303).

### Schedule vs cron

- **EventBridge Scheduler** (new) supports one-time and recurring schedules, retries, dead-letter queues, time zones, flexible windows.
- **EventBridge rule with `schedule_expression`** (cron/rate) still works but is older. Prefer Scheduler for production scheduling.

### Reactive automation patterns from source corpus

| Trigger | Action |
| --- | --- |
| CloudTrail `AuthorizeSecurityGroupIngress` -> EventBridge -> SNS/Lambda | Revert prohibited SG ingress (Q17, Q42) |
| AWS Config `NON_COMPLIANT` for `restricted-ssh` -> EventBridge -> SNS | Compliance alerting (Q96) |
| AWS Health `instance-retirement` -> EventBridge -> SSM Automation | Cordoned EC2 reboot during maintenance window (Q20, Q207, Q334) |
| CloudTrail `StopLogging` (CloudTrail tamper) -> EventBridge -> Lambda | Re-enable CloudTrail automatically (Q134) |
| GuardDuty finding `CryptoCurrency:EC2/BitcoinTool.B` -> EventBridge -> Lambda | Detach IAM, isolate SG, terminate instance (Q368) |
| CloudFormation drift detection finding -> EventBridge -> SNS | Notify lead engineer (Q311) |
| RDS storage-autoscaling event -> EventBridge -> CloudWatch dashboard | Visualize autoscaling actions (Q239) |
| CodePipeline state change -> EventBridge -> SNS/Chatbot/Lambda | Slack / Teams notifications (Q41, Q82, Q282) |

:::warning

## Exam tip - "scheduled poll" is almost never right

If you see options that propose "poll the API every N minutes with Lambda + EventBridge cron", scan for an option using **event-driven EventBridge rules on the actual service's events**. The event-driven option is almost always more operationally efficient and the correct answer (Q17, Q41, Q282).
:::

---

## 7. CloudTrail and audit

### Trail types

| Type | What it does |
| --- | --- |
| Single-account trail | Logs that account's API activity to S3 / CloudWatch Logs |
| Organization trail | Created in the management account; logs all member accounts |
| Multi-Region trail | Logs all Region API activity (recommended) |

### Event types

| Type | What it captures | Default |
| --- | --- | --- |
| Management events | Control-plane API calls (Create*, Delete*, ConsoleLogin) | Logged free by default for read+write |
| Data events | S3 object-level, Lambda Invoke, DynamoDB item-level | Off by default; paid; opt in |
| Insight events | Anomalous write API activity | Off by default; paid |

**ConsoleLogin** is a *management* event, not a data event -- many test questions get this wrong on purpose (Q156, Q386).

### CloudTrail Lake

A managed data lake for CloudTrail events with SQL-based queries; alternative to S3 + Athena. Up to 7-year retention.

### Centralizing across accounts

For org-wide login monitoring:

1. Create **organization trail** in management account; logs delivered to S3 in audit account.
2. EventBridge rule in audit account on `ConsoleLogin` events with `errorMessage = "Failed authentication"`.
3. Lambda counts failures per IAM user; on >= N in window, notify SNS (Q156, Q363, Q386).

---

## 8. Choosing among observability services

```text
Need traces across microservices? -> X-Ray (Q143, Q310, Q345)
Need browser performance and JS errors from real users? -> CloudWatch RUM (Q380)
Need synthetic uptime checks of an API or page? -> CloudWatch Synthetics canary (Q149)
Need quick SQL-style queries over CSV/JSON in S3? -> Athena (Q60, Q257)
Need dashboards over Athena results? -> QuickSight (Q257)
Need rich pivot tables / charts on container metrics with no setup? -> Container Insights
Need to identify top contributors to a metric (top IPs, top errors)? -> Contributor Insights
Need anomaly-based alarms on a noisy seasonal metric? -> CloudWatch anomaly detection alarms
Need to mask PII at ingestion? -> CloudWatch Logs data protection policies (Q290)
```

---

## 9. X-Ray service map essentials

- The X-Ray SDK adds trace context to outgoing requests (HTTP, AWS SDK calls).
- On EKS/ECS, the **X-Ray daemon runs as a DaemonSet** (one per node) or **sidecar** receiving UDP traces from app containers (Q310, Q345).
- For Lambda, enable **Active tracing** on the function; X-Ray captures init and handler segments.
- Use **X-Ray Insights** to surface anomalies in trace patterns automatically.

---

## 10. Log aggregation patterns

### Across accounts

- **Centralized CloudWatch Logs** via subscription filter destinations in an audit account. The audit account exposes a CloudWatch Logs destination with a resource-based policy.
- **Centralized S3** via Firehose -> S3 in audit account.

### Cost optimization

- Identify chatty log groups with **CloudWatch metrics**: `IncomingBytes` per log group + metric math (`SUM`) to spot top spenders (Q146).
- Move rarely-queried old logs to S3 with **subscription filter -> Firehose -> S3 + lifecycle to Glacier/Deep Archive** (Q103, Q356, Q383).
- For tiered access: 30 days in CloudWatch Logs (searchable), 90 days in S3 Standard-IA (low-latency), then Glacier Deep Archive (Q356).

### EKS comprehensive logging

- Control plane logs -> CloudWatch Logs (API server, audit, authenticator, controller-manager, scheduler).
- Container Insights for node and pod metrics.
- CloudTrail for AWS API calls.
- For application logs from pods: Fluent Bit DaemonSet -> CloudWatch Logs or OpenSearch (Q315, Q355).

### Application log security (PII masking)

CloudWatch Logs **data protection policies** mask sensitive fields (employee IDs, credit card numbers, custom regex) at ingestion. Define a managed or custom **data identifier** and an audit policy (Q290).

---

## 11. EventBridge + state machine patterns from the corpus

- **Fan-out from one event to many Lambdas**: EventBridge rule with multiple targets, or SNS topic fan-out, or Step Functions parallel state.
- **Parallel Lambda processing with independent retries**: use **SQS queues per Lambda**, each Lambda has its own redrive policy and DLQ (Q306).
- **Coordinated multi-step workflow**: Step Functions Standard for long-running orchestration; Express for high-throughput short workflows.

---

## 12. RDS, Redshift, Aurora audit logging

| Source | Path |
| --- | --- |
| RDS / Aurora MySQL audit logs | Native audit feature -> CloudWatch Logs |
| Aurora performance insights | Built-in dashboards |
| Redshift user activity | Audit logging -> CloudWatch Logs or S3, then dashboards from Logs Insights or Athena (Q302) |

---

## 13. Operational dashboards: Athena + QuickSight pattern

For log/data analysis on S3:

1. Logs land in S3 (via Firehose, direct service logging, or export).
2. Use AWS Glue Crawler to populate the Glue Data Catalog (or write the table DDL by hand).
3. Athena queries S3 with SQL (Q60, Q257, Q302).
4. QuickSight connects to Athena for dashboards (Q257).

For S3 access patterns (which video is most popular), enable **server access logging** -> S3 -> Athena (Q60, Q389).

---

## 14. EC2 monitoring gotchas

- Basic monitoring = 5-min metrics; detailed = 1-min metrics. Switch to detailed before tuning alarms on traffic spikes (Q380).
- Memory and disk metrics are **not** in basic CloudWatch -- need CloudWatch agent (Q261, Q318).
- **ApplicationELB / NetworkELB / EC2 / RDS** all expose `TargetResponseTime`, `HealthyHostCount`, `UnHealthyHostCount`, `RequestCount`. The right metric depends on the layer being measured.

---

## 15. AWS documentation anchors

- [CloudWatch metric filters](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/MonitoringLogData.html)
- [Subscription filters](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html)
- [CloudTrail event types](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-events-with-cloudtrail.html)
- [EventBridge cross-account](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cross-account.html)
- [CloudWatch agent](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Agent-on-EC2-Instance.html)
- [CloudWatch Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
- [CloudWatch RUM](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-RUM.html)
- [Data protection policies](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html)

:::note

## Key Takeaway -- Monitoring domain

Two facts dominate this domain: (1) metric filter = continuous; Logs Insights = ad-hoc; (2) EventBridge-on-event-source beats scheduled polling almost every time. Memorize what each CloudWatch sub-product is *for*, know that subscription filters cannot go directly to S3, and recognize the three-step org-wide audit pipeline: organization trail -> S3 in audit account -> EventBridge + Lambda + SNS.
:::
