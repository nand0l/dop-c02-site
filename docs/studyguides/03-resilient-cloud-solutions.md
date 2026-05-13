# Domain 3 - Resilient Cloud Solutions

**Source questions covered (52)**: Q2, Q5, Q12, Q36, Q40, Q49, Q50, Q57, Q65, Q73, Q79, Q91, Q104, Q115, Q131, Q132, Q133, Q135, Q153, Q157, Q161, Q166, Q169, Q171, Q176, Q182, Q193, Q195, Q204, Q208, Q229, Q243, Q251, Q258, Q263, Q266, Q270, Q271, Q278, Q281, Q305, Q307, Q314, Q316, Q325, Q339, Q348, Q361, Q362, Q374, Q385, Q388.

:::tip

## Learning Objectives

- Calculate which AWS services satisfy a given RTO/RPO target.
- Choose the right disaster-recovery pattern: backup-restore, pilot light, warm standby, multi-site active/active.
- Apply Auto Scaling correctly: warm pools, lifecycle hooks, predictive scaling, scaling policies, target tracking.
- Design multi-Region routing with Route 53, CloudFront, and Global Accelerator.
- Apply Lambda concurrency: reserved vs. provisioned, scaling Lambda for variable load.
- Replicate data across Regions: Aurora Global, DynamoDB Global Tables, S3 CRR/MRAP, EFS, FSx.

:::

---

## 1. DR strategy matrix

| Strategy | RTO | RPO | Cost | When it wins on the exam |
| --- | --- | --- | --- | --- |
| Backup and restore | Hours | Hours | Lowest | "Cost-sensitive", "RTO of several hours acceptable" |
| Pilot light | Tens of minutes | Minutes | Low | "Minimal idle resources in DR Region", scale up on failover (Q131, Q270) |
| Warm standby | Minutes | Seconds | Medium | "Always-on smaller fleet in DR Region", scale up on failover (Q133, Q161, Q314) |
| Multi-site active/active | Seconds | Near-zero | Highest | "Near-zero RTO and RPO", users served from both Regions (Q50, Q374, Q385) |

:::warning

## Exam tip - read the RPO/RTO numbers

Tight numerical RPO/RTO almost always rules out backup-restore. Look for: RTO &lt; 10 min and RPO &lt; 1 min => Aurora Global Database (Q133, Q161, Q316, Q361). RPO of seconds across Regions => DynamoDB Global Tables.
:::

---

## 2. Database resilience patterns

### Aurora Multi-AZ vs cross-Region read replica vs Global Database

| Goal | Choose |
| --- | --- |
| HA in one Region, automatic failover | Aurora Multi-AZ (writer + readers in 2+ AZs) |
| Disaster recovery to another Region with manual promotion | Cross-Region read replica |
| RPO &lt; 1 min, RTO &lt; 1 min across Regions, **managed** failover | **Aurora Global Database** (Q133, Q161, Q243, Q314, Q316) |
| Reduce maintenance impact | Add reader instances; failover during maintenance (Q5) |

Aurora Global Database replicates with sub-second lag using dedicated storage-layer replication. **Managed planned failover** flips writer Region in under a minute. **Unplanned failover** requires the secondary to be detached and promoted (Q243).

### RDS Multi-AZ vs RDS cross-Region read replica

- RDS Multi-AZ uses **synchronous** replication for non-Aurora engines; failover is automatic but stays in the same Region (Q325).
- RDS Multi-AZ **cluster deployments** add two readable standbys for higher availability and faster failover.
- For cross-Region HA on non-Aurora engines, combine Multi-AZ + a cross-Region **read replica**. Route 53 CNAME failover redirects the application to the promoted replica (Q316, Q361).

### DynamoDB Global Tables

- Active-active replication across Regions, conflict resolution by last-writer-wins on per-attribute timestamps.
- Required for stateless web apps with session data in DynamoDB and DR in a second Region (Q57, Q374, Q385).

### DAX caching

DAX is a read cache in front of DynamoDB. It does **not** reduce Lambda cold-start time -- the cold-start problem requires **provisioned concurrency** (Q2).

---

## 3. Object storage resilience

### S3 cross-Region replication (CRR) and SRR

- Replication requires versioning on both buckets, an IAM role for replication, and a replication configuration on the source bucket (Q36, Q385).
- **Replication Time Control (RTC)** guarantees 99.99% of new objects replicate within 15 minutes -- required when the RPO is &lt;=15 minutes (Q362).
- **Two-way replication** (multi-Region active-active) requires replication rules on both source and destination buckets (Q362, Q385).
- **S3 Multi-Region Access Points (MRAP)** provide a single endpoint over a global accelerator network and support automatic routing failover via the `SubmitMultiRegionAccessPointRoutes` API (Q307, Q362).
- For private-policy source buckets, the replication role must be able to read source objects -- the bucket policy and KMS key policy both need updating (Q36).

### S3 + CloudFront

- Use CloudFront with **Origin Failover** (origin groups) for fast failover from a primary ALB or S3 origin to a secondary (Q157, Q176, Q270).
- **Origin Shield** consolidates requests through one cache layer for better cache-hit ratio (Q251).

---

## 4. Auto Scaling resilience patterns

### Scaling policies

| Type | When to use |
| --- | --- |
| Target tracking | Most common; pick a metric (CPU, ALB request count per target, custom) and target value |
| Step scaling | Multi-step responses to alarm states (e.g., add 1 instance if CPU > 70%, add 4 if > 90%) |
| Predictive scaling | ML-based, scales ahead of forecast load (e.g., daily morning ramp-up) |
| Scheduled actions | Known traffic patterns (close at 6 PM, open at 6 AM) |

For SQS-driven workers, target-tracking on **`ApproximateNumberOfMessagesVisible` per task** (custom metric math) rather than CPU. The CPU metric does not reflect queue backlog and leads to under-scaling (Q283, Q293, Q340).

### Warm pools

A **warm pool** holds pre-initialized EC2 instances in `Stopped` (or `Hibernated`) state. When the ASG needs to scale out, it brings warm instances to `InService` much faster than launching from scratch. Use for: long-cold-start applications, large AMIs, predictable spikes (Q73, Q169).

### Lifecycle hooks

- `autoscaling:EC2_INSTANCE_LAUNCHING` -- pause at launch to bootstrap (e.g., download license, register with discovery service).
- `autoscaling:EC2_INSTANCE_TERMINATING` -- pause at termination to drain connections, **export logs to S3 before instance disappears** (Q28).
- Complete the hook with `complete-lifecycle-action`.

### Notifications

- Auto Scaling group notifications publish to **SNS** for `EC2_INSTANCE_LAUNCH`, `LAUNCH_ERROR`, `TERMINATE`, `TERMINATE_ERROR` (Q132).
- For richer event routing (Lambda, EventBridge cross-account fan-out), subscribe an EventBridge rule to `EC2 Auto Scaling` events.

### Common ASG failure modes

- Failing-to-launch instances often indicate a bad AMI ID in the launch template. Create a fresh AMI from a running instance, update the launch template version, and let the ASG replace failed instances. **Do not** delete the ASG -- new AMI + updated launch template + scaling activity is sufficient (Q166).
- Health-check type defaults to EC2; switch to **ELB** to replace instances that fail ALB target group health checks (Q204).

:::warning

## Exam tip - StatusCheckFailed_System vs _Instance

- `StatusCheckFailed_System` = AWS underlying infrastructure issue. Configure an EC2 **recovery action** on a CloudWatch alarm for `StatusCheckFailed_System` to migrate the instance to new hardware while preserving instance ID and IP (Q45, Q337).
- `StatusCheckFailed_Instance` = OS or instance config problem. Recovery does not help; reboot or replace.

:::

---

## 5. Multi-Region routing patterns

### Route 53

| Routing policy | Use case |
| --- | --- |
| Simple | Single endpoint |
| Weighted | A/B traffic split, gradual cutover, active/standby (weight 100/0) (Q79, Q271) |
| Latency-based | Route to lowest-latency Region for end user (Q50, Q314, Q374) |
| Failover | Primary/secondary with health check on primary (Q157, Q176, Q316) |
| Geolocation | Compliance/sovereignty routing |
| Geoproximity | Bias towards a Region (Traffic Flow only) |
| Multivalue answer | Returns multiple healthy records |

Health checks on Route 53 monitor endpoints and remove unhealthy records from responses.

### Route 53 Application Recovery Controller (ARC)

- **Routing controls** are on/off switches that you flip during DR.
- **Safety rules**: assertion (min N controls on), gating (cannot flip B unless A is on).
- Use ARC when you need **manual, deterministic** failover that respects business safety constraints (Q182).
- **Zonal Shift / Zonal Autoshift**: temporarily remove traffic from one AZ in an ALB/NLB target group during AZ impairment (Q176, Q182).

### CloudFront

- Origin failover groups: primary origin + secondary; CloudFront switches on configured HTTP error codes.
- Faster than DNS-based failover because CloudFront keeps health state per edge.
- Useful for fast cross-Region failover of ALB origins (Q157, Q176, Q270).

### Global Accelerator

- Anycast IPs routed over AWS global backbone -> lower latency, faster failover than public-internet routing.
- Use when: dynamic content (cannot use CloudFront caching), TCP/UDP non-HTTP traffic, or you need static IPs (Q266, Q305).
- ALB + Global Accelerator for WebSocket apps requiring sticky sessions in multiple Regions (Q305).

---

## 6. Lambda scalability and resilience

### Concurrency types

| Type | What it does | When to use |
| --- | --- | --- |
| Reserved concurrency | Caps and reserves a function's share of regional concurrency | Protect downstream from a hot function; prevent runaway |
| Provisioned concurrency | Pre-initialized execution environments, no cold start | Latency-sensitive endpoints, large init payloads (Q2, Q193) |
| Application Auto Scaling on provisioned concurrency | Scales provisioned concurrency on a target metric | Daytime spike / nighttime drop pattern (Q2) |

Lambda provisioned concurrency reduces cold-start latency from seconds (large init like loading DynamoDB tables) to single-digit ms (Q2).

### Lambda + Kinesis tuning

- **Enhanced fan-out**: each consumer gets dedicated 2 MB/s per shard (Q175).
- **Parallelization factor**: process multiple batches per shard simultaneously (up to 10).
- **`MaximumRetryAttempts`** and **`OnFailure` destination** to stop endlessly retrying poison records (Q175).

### Lambda + SQS tuning

- For long-running SQS workers (15-minute-plus tasks), the **reserved concurrency** can keep too few workers if traffic surges. Track `ApproximateAgeOfOldestMessages` to detect backlog (Q12).
- Use `BatchItemFailures` to mark only failed items rather than the whole batch.

### Lambda destinations and DLQ

- For SNS-triggered Lambda, configure an **on-failure destination** (SQS DLQ) so that failures retry then go to the DLQ (Q116, Q144).
- Async-invoke retries are 2 by default; configure with `MaximumRetryAttempts` (0 or 1 or 2).

### RDS Proxy

- Use RDS Proxy in front of Aurora/RDS when Lambda hits connection-limit issues. Proxy multiplexes connections and improves cold-start time when paired with provisioned concurrency (Q159).

---

## 7. Stateless application patterns

- **Externalize session state** to DynamoDB or ElastiCache. Sticky sessions are a partial fix but break under immutable deploys (Q115).
- For local cache invalidation after deploy, add an `AfterInstall` or `ApplicationStart` script in CodeDeploy that purges the cache directory (Q87, Q336).

---

## 8. File-system resilience

| Service | Workload | Cross-Region replication |
| --- | --- | --- |
| EFS | Linux NFSv4, POSIX semantics | EFS Replication (single destination Region) |
| FSx for Windows | SMB for Windows apps | FSx file system replication, AWS Backup |
| FSx for Lustre | HPC scratch / persistent | S3-linked, persistent type supports DR via S3 |
| FSx for NetApp ONTAP | Multi-protocol (SMB + NFS), enterprise NAS features | SnapMirror cross-Region (Q153, Q263, Q339) |
| FSx for OpenZFS | NFS for Linux | Backups |
| Storage Gateway (File Gateway) | Hybrid file-share | S3-backed; cache refresh API for new objects (Q35) |

**FSx for NetApp ONTAP Multi-AZ** supports both SMB and NFS from the same file system -- the right answer when the question says "Windows and Linux EC2 instances share a single file system" (Q229).

**EFS access from cross-account Lambda** requires (a) EFS file system policy allowing the other account, (b) Lambda function in a VPC with access to a mount target, and (c) the right IAM permissions on the role (Q135).

**EKS pods mounting EFS via the EFS CSI driver** require NFS 2049 open from worker nodes to EFS, the EFS CSI driver installed, and an `efs-sc` StorageClass referencing the file system (Q348).

---

## 9. Container and orchestration resilience

### ECS

- **Fargate** removes EC2 management overhead -- prefer it for stateless services (Q258).
- ECS service auto-scaling uses **Application Auto Scaling** with target tracking on `ECSServiceAverageCPUUtilization`, `ALBRequestCountPerTarget`, or custom metrics (Q253, Q340).
- Capacity providers (FARGATE + FARGATE_SPOT) let you mix on-demand and spot.

### EKS

- **EKS Auto Mode** (newer) automates control-plane and node-group upgrades on the AWS support schedule (Q382).
- For comprehensive logging: enable **EKS control plane logs** to CloudWatch + **Container Insights** for nodes/pods + CloudTrail data events for API requests (Q315, Q355).

---

## 10. Cross-region multi-account DR architecture cheat sheet

```text
Primary Region                     Secondary Region
-----------------------------------------------------
Route 53 failover --health check-> /
 |                                  \
 ALB / NLB / CloudFront             ALB (pilot-light, scaled to 0)
 |                                  |
 ECS Fargate / EC2 ASG (full size)  EC2 ASG (min=0, max=full)
 |                                  |
 Aurora Global Writer  ----async->  Aurora Global Reader (promote on DR)
 |                                  |
 DynamoDB (Global Tables)  <----->  DynamoDB replica (active-active)
 |                                  |
 S3 (versioned, RTC)       ---CRR-> S3 destination
 |                                  |
 Backups via AWS Backup    -+-->    AWS Backup vault in DR account
```

Pilot light: secondary Region holds replicated data, minimal compute (ASG min=0). On failover, scale ASG up and flip Route 53 record (Q131, Q270, Q314).

---

## 11. Network resilience

### NAT high availability

A single NAT instance is a SPOF. Replace with **NAT Gateway** in each AZ (one per AZ, with a route table per AZ) for cross-AZ resilience (Q40).

### Cross-zone load balancing

- **ALB**: cross-zone always on (and you cannot disable on a target group level without trade-offs).
- **NLB**: cross-zone off by default; enable per target group.
- Question pattern: requests in one AZ being routed to instances in another AZ unexpectedly -> turn off cross-zone load balancing on the target group (Q208).

### Overlapping VPC CIDRs

When 20 service teams all use `192.168.0.0/16` in separate accounts, neither Transit Gateway nor peering will work. Use **AWS PrivateLink** to expose only the required service endpoint, side-stepping CIDR conflicts (Q109).

---

## 12. Common wrong-answer patterns in resilience questions

- Choosing **RDS Multi-AZ** for cross-Region DR -- Multi-AZ is in-Region only.
- Picking **DynamoDB DAX** to fix cold-start latency -- DAX does not affect Lambda init time (Q2).
- Adding **CloudFront** to fix a backend latency issue -- CloudFront caches at the edge but does not accelerate dynamic non-cacheable calls; pick **Global Accelerator** for that (Q266).
- Disabling **cross-zone load balancing** when AZ-aware traffic is *desired* (it usually isn't -- watch the question carefully).
- Using **Lambda reserved concurrency = 0** to throttle a function -- this **disables invocation**, not throttles it (Q2 option B).

---

## 13. AWS documentation anchors

- [Auto Scaling lifecycle hooks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html)
- [Auto Scaling SNS notifications](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ASGettingNotifications.html)
- [EC2 instance recovery](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-recover.html)
- [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [NAT gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [S3 Replication Time Control](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html)

:::note

## Key Takeaway -- Resilience domain

Memorize the RTO/RPO ladder: backup-restore (hours) -> pilot light (tens of min) -> warm standby (minutes) -> active/active (seconds). Connect each pattern to its canonical data layer: Aurora Global Database for relational RPO &lt; 1min, DynamoDB Global Tables for NoSQL active/active, S3 CRR with RTC for object DR. For routing layer, Route 53 latency for global users, Route 53 failover for DR cutover, Global Accelerator for dynamic non-cacheable traffic, CloudFront origin failover for static and HTTP origins.
:::
