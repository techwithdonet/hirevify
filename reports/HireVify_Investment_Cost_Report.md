# HireVify Product Development, AWS Infrastructure and First-Year Funding Requirement

**Investor-facing estimate — 21 July 2026**  
**Primary AWS region:** Asia Pacific (Mumbai), `ap-south-1`  
**Currency basis:** US$1 = **₹96.235**, the 21 July 2026 USD/INR market close reported by Reuters. INR values are rounded; taxes, payment-provider GST, foreign-exchange spreads and withholding are excluded unless stated.  
**Important:** this is a planning estimate, not a supplier quotation or a promise of delivery cost.

## 1. Executive summary

HireVify is an early-stage recruitment platform intended to connect candidates and recruiters around skills-first hiring, jobs, practical projects, assessments, resume/ATS tools and AI-assisted career workflows. It targets the fragmented experience of building candidate evidence, discovering opportunities, screening applicants and managing applications.

The repository contains a broad and visually substantial Next.js 16 frontend: public marketing, candidate and recruiter dashboards, profile editors, job posting/search/application screens, project assignments, assessments, ATS scanners, resume building, admin screens and analytics concepts. Some core flows use Supabase Auth, PostgreSQL tables and Storage; five AI routes use Gemini/Groq-style providers with authentication and premium checks. However, numerous screens use mock or browser-local data, database migrations are fragmented, payment routes deliberately return HTTP 503, there are no automated production tests or CI/CD/IaC, and the fresh build/lint checks did not finish within the audit timeout. Production readiness is therefore estimated at **32%**, not production-ready.

Additional investment is required to turn the prototype into a coherent, secure, tested service: rationalise scope and code, establish an authoritative schema and RLS model, complete core candidate/recruiter workflows, implement payments and notifications, harden AI and file processing, create AWS environments, test security/recovery and fund twelve months of operation and support.

With the recommended plan, a focused team should deliver a launchable Standard Production release in **8–10 months**, followed by monitored optimisation. The recommended funding range is **US$420,000–US$570,000 (₹4.04–₹5.49 crore)**, with a planning target of **US$490,000 (₹4.72 crore)**. This funds the realistic development case, launch, a year of standard infrastructure/third-party usage, maintenance, and at least 15% contingency; paid marketing is shown separately.

## 2. Current product status

Classification reflects implementation, not the presence of a page or button.

| Area | Status | Repository evidence and interpretation |
|---|---|---|
| Marketing/SEO | Partially complete | `app/page.tsx`, `app/[marketing]/page.tsx`, sitemap, robots, Open Graph/Twitter image and polished `Homepage.tsx`; SEO/accessibility validation is absent. |
| Authentication | Functional but incomplete | `AuthProvider.tsx` uses Supabase sign-up/password login/session events. No implemented password-reset UI, verified email flow, MFA, durable distributed throttling or account lockout. Browser storage duplicates user/access-token state. |
| Candidate profile | Partially complete | Large editor and Supabase profile service exist; schema repair SQL files show unresolved drift and no automated schema verification. |
| Recruiter profile | Partially complete | Editor/settings and `recruiter_profiles` writes exist; end-to-end authorization and onboarding are untested. |
| Jobs | Partially complete | Supabase CRUD/search services and job UI exist. Browser writes rely on RLS; ownership policy is not proven from an ordered migration set. |
| Applications | Partially complete | Apply/list/status/withdraw logic exists, including resume attachment handling; transactional integrity and complete access-control tests are absent. |
| Projects/career growth | Partially complete | Services and several migrations exist; complex assignment/submission flows remain untested and schema is fragmented. |
| Assessments | Partially complete / mock mix | Admin assessment API exists, while candidate results include `MOCK_ASSESSMENT_RESULTS`; referenced `assessment_results`/`assessment_questions` are not consistently present in the authoritative root migration. |
| Resume parsing/storage | Partially complete | PDF/DOCX parsing code, private-storage attempts and AI parse route exist; malware scanning, robust MIME inspection, retention and guaranteed deletion are missing. |
| ATS matching | Partially complete / demo mix | Deterministic service plus authenticated AI route exist, alongside many duplicate experimental scorers and demo fallbacks. No validated benchmark or regression suite. |
| Resume rewriting/AI summary | Partially complete | Authenticated premium routes, payload limits and provider fallback exist. Output-schema enforcement, prompt-injection controls, timeouts, durable quotas and privacy controls are incomplete. |
| Notifications/messaging | Mock/demo and partial DB | Supabase notification hook exists, but `NotificationCenter.tsx` deliberately generates mock notifications; messaging/interview screens are not backed by a verified complete service. |
| Subscription/premium | Partially complete | Subscription table/service and server-side premium check exist; browser-local premium state also exists. Admin can manually activate Pro. |
| Payments | **Not implemented** | All payment endpoints return 503; no checkout, signature-verified webhook, invoice, refund or billing history implementation. Unsafe for real transactions. |
| Admin | Partially complete | HMAC HttpOnly session, database-backed login RPC, health/data/assessment APIs exist. It is one undifferentiated admin role with process-local throttling and no audit log. |
| Analytics/reporting | Frontend only / derived | Multiple dashboard/chart components exist, but no production event pipeline, warehouse, metric definitions or export/report scheduler. |
| Integrations | Mock/demo | Integration utility explicitly switches to demo mode; several integrations are “Coming Soon.” |
| Database | Partially complete / unable to verify live | Supabase client and many SQL patches exist. There is no single ordered migration history; referenced tables and naming variants do not fully align. Live RLS/backups were not inspected. |
| API/backend | Partially complete | 14 effective route files: five AI, five admin, three disabled payment routes and a dev-only Supabase test. Most business CRUD is direct browser-to-Supabase. Duplicate `src/app/api/...` code is outside the active root App Router. |
| Deployment | Partially complete | Vercel metadata and multi-stage Dockerfile exist, but `output: "standalone"` is absent from `next.config.ts`; no AWS IaC, CI/CD, staging, alarms or rollback runbook. |
| Testing | Not implemented | No Jest/Vitest/Playwright/Cypress configuration or executable test script. Files named `*-test.tsx` are diagnostic utilities, not a test suite. |

## 3. Recommended production architecture

### Practical target

Use a **modular monolith** first. Splitting the current product into microservices would increase cost and operational risk without evidence of scale requiring it.

```text
Users
  -> Route 53 + ACM
  -> CloudFront + AWS WAF
      -> Application Load Balancer
          -> ECS Fargate: Next.js 16 web/BFF (2 tasks in production)
              -> Cognito user pools (or retain Supabase Auth during migration)
              -> RDS PostgreSQL Multi-AZ
              -> S3 private resume/attachment buckets (signed URLs)
              -> SQS worker queue -> ECS/Lambda document/AI workers
              -> Gemini/Groq initially; evaluate Bedrock after quality/cost benchmark
              -> SES transactional email
              -> CloudWatch logs/metrics/alarms + CloudTrail
Secrets Manager / KMS -> app and workers
AWS Backup -> RDS/S3 policy; cross-region copies for growth plan
CI/CD -> ECR -> ECS rolling deployment; separate dev/stage/prod accounts or environments
```

- **Frontend/API:** deploy the existing dynamic Next.js Node application as a container on ECS Fargate behind ALB. CloudFront caches static assets and selected anonymous responses. This matches the Docker direction and avoids forcing dynamic App Router behaviour into static hosting.
- **Database:** RDS PostgreSQL. Lean may use Single-AZ `db.t4g.small`; Standard uses Multi-AZ `db.t4g.medium`; Growth uses Multi-AZ `db.r7g.large` (or measured equivalent), Performance Insights and read-replica only when measurements justify it. Use RDS Proxy if serverless/background concurrency warrants it.
- **Auth:** Cognito is the all-AWS end state, but a staged migration from Supabase Auth reduces launch risk. Enforce candidate/recruiter/admin claims server-side. Admins should use the same identity system with MFA, not a shared panel credential.
- **Files:** private, encrypted S3 buckets; presigned upload/download; quarantine prefix; MIME/magic-byte checks; antivirus worker; lifecycle and deletion policies. Never public resume URLs.
- **AI:** queue long parse/analysis jobs with SQS and workers. Store job status, token usage and provider request ID, not raw prompts in general logs. Set per-user and global spend caps. Keep provider abstraction and benchmark Bedrock versus Gemini/Groq.
- **Email:** SES for verification, password reset and transactional messages; configure SPF, DKIM, DMARC, bounce/complaint handling.
- **Security/operations:** WAF managed baseline, Shield Standard, KMS encryption, Secrets Manager, least-privilege IAM, CloudWatch alarms, CloudTrail, GuardDuty for Standard/Growth, Security Hub when operational capacity exists.
- **Backups/DR:** RDS automated backups (35 days Standard), PITR, S3 versioning, AWS Backup policy, quarterly restore tests. Growth copies backups to Hyderabad (`ap-south-2`) with a documented RPO/RTO.
- **Environments:** local/dev, persistent staging and production with separate credentials/databases/buckets; ideally separate AWS accounts under Organizations. Infrastructure must be Terraform or CDK.

## 4. Development phases

Rates below are blended delivery cost including normal overhead; amounts are ranges, not quotes. One person-week = five person-days.

| Phase | Objective and specific deliverables | Specialists | Effort | Min / expected / high (USD; INR) | Dependencies / risks / completion criteria |
|---|---|---:|---:|---:|---|
| 0 – Discovery/planning | Product scope, code/schema inventory, threat/data-flow model, backlog, ADRs, acceptance metrics | Lead, PM, UX, security | 15–25 pd | $9k / $15k / $24k; ₹8.66L / ₹14.44L / ₹23.10L | None; scope churn. Complete when owner signs scope, architecture and data map. |
| 1 – UI/UX and frontend | Journey audit, design system rationalisation, responsive/accessibility fixes, remove misleading demo states | UX, frontend, QA | 35–60 pd | $18k / $32k / $50k; ₹17.32L / ₹30.80L / ₹48.12L | Phase 0; large components. Complete at approved responsive WCAG-oriented journeys. |
| 2 – Backend/database | Canonical schema, ordered migrations, constraints/indexes/RLS, server BFF, audit/event model | Backend, DB, lead | 65–100 pd | $35k / $58k / $85k; ₹33.68L / ₹55.82L / ₹81.80L | Phase 0; schema drift. Complete with clean migration and integration tests. |
| 3 – Auth/roles | Registration, verification, reset, sessions, RBAC, admin MFA, rate limits, account lifecycle | Backend, frontend, security | 35–55 pd | $20k / $34k / $52k; ₹19.25L / ₹32.72L / ₹50.04L | Phase 2; identity migration. Complete on negative permission matrix. |
| 4 – Core workflows | Candidate/recruiter onboarding, jobs CRUD/search, apply/review/status, notifications, deletion | Full-stack, QA | 75–120 pd | $42k / $70k / $105k; ₹40.42L / ₹67.36L / ₹101.05L | Phases 2–3; scope breadth. Complete via E2E happy/error paths. |
| 5 – Resume/ATS/AI | Secure upload pipeline, parser benchmark, ATS contract, AI validation, quotas, async jobs, privacy | AI, backend, security, QA | 55–90 pd | $35k / $58k / $88k; ₹33.68L / ₹55.82L / ₹84.69L | 2–4; model quality/cost. Complete at quality, privacy, latency and cost thresholds. |
| 6 – Billing | Razorpay checkout, verified idempotent webhooks, entitlements, invoices/history, failure/refund ops | Backend, full-stack, QA | 30–45 pd | $18k / $30k / $45k; ₹17.32L / ₹28.87L / ₹43.31L | 3; provider/KYC/tax. Complete after sandbox E2E and finance sign-off. |
| 7 – Admin/analytics | Scoped admin roles, audit log, user/content controls, defined operational funnel, exports | Full-stack, data/QA | 35–60 pd | $20k / $35k / $55k; ₹19.25L / ₹33.68L / ₹52.93L | 2–6; metric ambiguity. Complete with permission and reconciliation checks. |
| 8 – Security/compliance | Threat remediation, headers/CSRF/SSRF/file controls, DPIA support, incident runbooks | AppSec, lead, legal | 25–45 pd | $22k / $38k / $65k; ₹21.17L / ₹36.57L / ₹62.55L | All core flows; specialist availability. Complete after critical/high findings close. |
| 9 – QA | Unit/component/API/DB/E2E/a11y/performance/load suites and traceability | QA/SDET, developers | 55–90 pd | $28k / $48k / $72k; ₹26.95L / ₹46.19L / ₹69.29L | Stable scope; test debt. Complete at agreed coverage and zero launch blockers. |
| 10 – AWS/DevOps | Accounts/VPC/IaC/ECS/RDS/S3/SQS/SES/WAF, CI/CD, secrets, alarms, budgets, DR tests | AWS/DevOps, DB, security | 35–55 pd | $28k / $45k / $68k; ₹26.95L / ₹43.31L / ₹65.44L | Architecture/schema; AWS quotas. Complete after staging deployment and restore/rollback. |
| 11 – Launch | Migration rehearsal, performance test, go/no-go, production deploy, smoke tests | Entire core team | 15–25 pd | $10k / $18k / $28k; ₹9.62L / ₹17.32L / ₹26.95L | 1–10; cutover risk. Complete after monitored launch and acceptance. |
| 12 – Support/optimisation | 90-day hypercare, SLO review, defects, cost tuning, backlog handover | Full-stack, DevOps, QA | 25–45 pd | $15k / $28k / $45k; ₹14.44L / ₹26.95L / ₹43.31L | Launch; unpredictable incidents. Complete at stable SLOs and operational handoff. |

**Phase total (overlapping specialists):** approximately **405–670 person-days** and **$300k minimum / $509k expected / $782k high** before staffing-model discounts, scope deferral and contingency. A deliberately constrained MVP can reduce this by deferring career-growth, interviews, integrations and advanced analytics; it cannot safely defer auth/RLS, payments integrity, file security, tests or operations.

## 5. Development team cost

### India-oriented planning rates

| Role | Typical India freelance/day | Agency/dedicated/day | International specialist note |
|---|---:|---:|---|
| Senior full-stack / technical lead | $350–650 (₹33.7k–₹62.6k) | $550–950 | $900–1,600/day for niche international work |
| Frontend developer | $220–450 | $350–700 | — |
| Backend developer | $280–550 | $450–800 | — |
| UI/UX designer | $220–450 | $350–700 | Specialist research may be higher |
| AWS/DevOps engineer | $350–700 | $550–950 | $1,000–1,700/day specialist |
| Database engineer | $350–700 | $550–950 | — |
| QA/SDET | $180–400 | $300–600 | — |
| Application-security specialist | $500–1,000 | $800–1,500 | $1,200–2,500/day specialist |
| AI integration engineer | $400–800 | $650–1,100 | $1,000–1,800/day specialist |
| PM/product/technical lead | $300–650 | $500–900 | — |
| Privacy/legal consultant | $600–1,500 | matter-based | India counsel plus cross-border specialist if needed |

### Hiring models

| Model | Recommended structure | Duration | One-time build estimate | Advantages | Risks / suitability |
|---|---|---:|---:|---|---|
| Freelancer | 1 lead, 2 full-stack, part-time UX/DevOps/QA/security | 10–14 months | $240k–$380k (₹2.31–₹3.66cr) | Lowest cash rate, flexible | Key-person risk, integration/management burden; suitable only for a tightly reduced MVP. |
| Small agency | Lead/PM, 2 full-stack, frontend, QA; fractional UX/DevOps/security/AI | 8–10 months | $330k–$520k (₹3.18–₹5.00cr) | Balanced accountability and speed | Quality varies; change requests can inflate price. **Recommended model.** |
| Dedicated professional team | Lead/PM, 2 backend, 2 frontend/full-stack, QA/SDET, DevOps, UX; fractional DB/security/AI/legal | 7–9 months | $500k–$780k (₹4.81–₹7.51cr) | Parallel delivery, stronger assurance | Highest burn; justified only with committed go-to-market and growth scope. |

## 6. One-time setup and launch costs

| Item | Mandatory? | Minimum / realistic / high USD | Realistic INR | Notes |
|---|---|---:|---:|---|
| Discovery and architecture | Yes | $9k / $15k / $24k | ₹14.44L | Phase 0 |
| UI/UX and branding refinement | Yes / brand expansion optional | $12k / $25k / $45k | ₹24.06L | Includes accessibility review |
| Application development/remediation | Yes | $205k / $350k / $560k | ₹3.37cr | Core build excluding specialist tests below |
| Database design/migration | Yes | $20k / $35k / $55k | ₹33.68L | Canonical migrations and data rehearsal |
| AWS architecture/accounts/IaC/CI/CD | Yes | $22k / $38k / $60k | ₹36.57L | Environments, IAM, pipeline, rollback |
| Domain registration and SSL | Yes | $20 / $50 / $150 | ₹4.8k | ACM certificate itself $0; domain varies by TLD |
| Email/domain authentication | Yes | $1k / $2k / $4k | ₹1.92L | SES, SPF/DKIM/DMARC |
| Security review and penetration test | Yes | $15k / $30k / $55k | ₹28.87L | Independent retest included |
| Performance/load/recovery testing | Yes | $8k / $18k / $30k | ₹17.32L | Tool usage may add cost |
| Data migration | Conditional | $5k / $12k / $30k | ₹11.55L | Depends on live Supabase data |
| Legal/privacy/terms/cookie documents | Yes | $8k / $18k / $35k | ₹17.32L | Qualified legal review required |
| Monitoring/backups/runbooks | Yes | $6k / $12k / $20k | ₹11.55L | Includes restore test |
| Technical/user documentation | Yes | $5k / $10k / $18k | ₹9.62L | Admin/support playbooks |
| Launch/hypercare | Yes | $10k / $22k / $40k | ₹21.17L | 30–90 days depending model |
| Formal identity verification | Optional | $0 / $8k / $25k | ₹7.70L | Only if business requirements demand it |

These line items overlap the phase/team estimate and **must not be added twice**. They are a procurement view, not an additional subtotal.

## 7. AWS monthly operating cost

All amounts are modeled estimates checked **21 July 2026** against AWS public pricing pages/calculator conventions. Mumbai prices can differ from examples shown on global pages. AWS bills actual consumption. No Free Tier credit is relied upon.

### Detailed plans

| Cost item / AWS service | Lean MVP assumption | Standard Production assumption | Growth assumption | Source |
|---|---:|---:|---:|---|
| Route 53/domain amortisation | $2/mo; $24/yr; ₹193/₹2.31k | $3; $36; ₹289/₹3.46k | $5; $60; ₹481/₹5.77k | [Route 53 pricing](https://aws.amazon.com/route53/pricing/) |
| CloudFront + transfer | 100 GB, 2m req: $15; $180; ₹1.44k/₹17.32k | 500 GB, 8m: $65; $780; ₹6.26k/₹75.06k | 2 TB, 30m: $240; $2,880; ₹23.10k/₹2.77L | [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/) |
| ALB | 1 low-LCU: $25; $300; ₹2.41k/₹28.87k | 1 moderate: $35; $420; ₹3.37k/₹40.42k | 2/greater LCU: $90; $1,080; ₹8.66k/₹1.04L | [ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/) |
| ECS Fargate web/API | 1×0.5vCPU/1GB plus standby periods: $45; $540; ₹4.33k/₹51.97k | 2×1vCPU/2GB always on: $145; $1,740; ₹13.95k/₹1.67L | 4×2vCPU/4GB avg: $580; $6,960; ₹55.82k/₹6.70L | [Fargate pricing](https://aws.amazon.com/fargate/pricing/) |
| RDS PostgreSQL compute | Single-AZ t4g.small: $45; $540; ₹4.33k/₹51.97k | Multi-AZ t4g.medium: $180; $2,160; ₹17.32k/₹2.08L | Multi-AZ r7g.large: $620; $7,440; ₹59.66k/₹7.16L | [RDS pricing](https://aws.amazon.com/rds/postgresql/pricing/) |
| RDS storage/I/O | 50 GB gp3: $8; $96; ₹770/₹9.24k | 150 GB: $28; $336; ₹2.69k/₹32.34k | 600 GB: $115; $1,380; ₹11.07k/₹1.33L | same |
| Backups/AWS Backup | 50 GB incremental: $5; $60; ₹481/₹5.77k | 250 GB/35-day: $25; $300; ₹2.41k/₹28.87k | 1 TB + cross-region: $110; $1,320; ₹10.59k/₹1.27L | [AWS Backup pricing](https://aws.amazon.com/backup/pricing/) |
| S3 resumes/attachments | 25 GB + requests: $3; $36; ₹289/₹3.46k | 150 GB: $10; $120; ₹962/₹11.55k | 750 GB: $35; $420; ₹3.37k/₹40.42k | [S3 pricing](https://aws.amazon.com/s3/pricing/) |
| Cognito | 400/4k/20k MAU: $0 / $0 / $55; annual $0/$0/$660; growth ₹5.29k/₹63.51k | Essentials/Lite threshold assumption | usage-based | [Cognito pricing](https://aws.amazon.com/cognito/pricing/) |
| SES email | 5k: $1; $12; ₹96/₹1.15k | 40k: $5; $60; ₹481/₹5.77k | 200k: $25; $300; ₹2.41k/₹28.87k | [SES pricing](https://aws.amazon.com/ses/pricing/) |
| CloudWatch/logs/alarms | 10 GB: $15; $180; ₹1.44k/₹17.32k | 50 GB: $55; $660; ₹5.29k/₹63.51k | 200 GB: $190; $2,280; ₹18.28k/₹2.19L | [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/) |
| WAF | 1 ACL/basic rules: $14; $168; ₹1.35k/₹16.17k | 2 ACLs/rules: $30; $360; ₹2.89k/₹34.64k | 2 ACLs/managed/bot traffic: $85; $1,020; ₹8.18k/₹98.16k | [WAF pricing](https://aws.amazon.com/waf/pricing/) |
| Secrets Manager/KMS | 10 secrets: $6; $72; ₹577/₹6.93k | 25: $14; $168; ₹1.35k/₹16.17k | 50: $30; $360; ₹2.89k/₹34.64k | [Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/) |
| SQS/EventBridge/workers | Light: $5; $60; ₹481/₹5.77k | Moderate: $25; $300; ₹2.41k/₹28.87k | Heavy: $120; $1,440; ₹11.55k/₹1.39L | [SQS pricing](https://aws.amazon.com/sqs/pricing/) |
| ECR/CloudTrail/GuardDuty | $4; $48; ₹385/₹4.62k | $45; $540; ₹4.33k/₹51.97k | $130; $1,560; ₹12.51k/₹1.50L | [GuardDuty pricing](https://aws.amazon.com/guardduty/pricing/) |
| Staging environment | scale-to-low: $45; $540; ₹4.33k/₹51.97k | persistent small: $140; $1,680; ₹13.47k/₹1.62L | prod-like: $400; $4,800; ₹38.49k/₹4.62L | component sources above |
| AWS Support | Basic $0 | Developer: $29 | Business minimum: $100 | [AWS Support pricing](https://aws.amazon.com/premiumsupport/pricing/) |
| **AWS monthly/annual subtotal** | **$232 / $2,784; ₹22.33k / ₹2.68L** | **$834 / $10,008; ₹80.27k / ₹9.63L** | **$2,895 / $34,740; ₹2.79L / ₹33.43L** | Rounded estimate |
| External AI budget (not AWS) | $100 / $1,200; ₹9.62k/₹1.15L | $750 / $9,000; ₹72.18k/₹8.66L | $4,000 / $48,000; ₹3.85L/₹46.19L | Provider usage; see §9 |
| **Monthly cloud + AI** | **$332 (₹31.95k)** | **$1,584 (₹1.52L)** | **$6,895 (₹6.64L)** | Usage-based |

Fixed items include provisioned compute/database, hosted zones, WAF rules and support minimums. Transfer, storage, requests, email, logging, queues, auth and AI are usage-based. Reserved/Savings Plans should be considered only after 2–3 months of measured steady load.

## 8. Usage assumptions

| Driver | Early (1,000 registered) | Growing (10,000) | Expansion (50,000) |
|---|---:|---:|---:|
| Monthly active users | 400 | 4,000 | 20,000 |
| Recruiter accounts | 50 | 500 | 2,500 |
| Resume uploads/month; average size | 500; 1.5 MB | 5,000; 1.5 MB | 25,000; 1.5 MB |
| ATS scans/month | 1,000 | 12,000 | 70,000 |
| AI requests/month | 1,500 | 20,000 | 120,000 |
| Active job listings | 200 | 2,000 | 10,000 |
| Applications/month | 1,500 | 20,000 | 120,000 |
| Transactional emails/month | 5,000 | 40,000 | 200,000 |
| API requests/month | 2 million | 8 million | 30 million |
| Database size after year | 20–50 GB | 100–200 GB | 400–800 GB |
| Object storage after year | 25 GB | 150 GB | 750 GB |
| Internet bandwidth/month | 100 GB | 500 GB | 2 TB |
| Logs/month / retention | 10 GB / 30 days | 50 GB / 90 days | 200 GB / 90–365 days |
| Backups | 7–14 day minimum | 35-day PITR + monthly archive | 35-day PITR + cross-region archive |

Compute concurrency, database IOPS/storage, bandwidth, logs and especially AI calls grow with active usage—not merely registered users. Resume retention can make storage and privacy liabilities grow even when activity falls.

## 9. Third-party and AI costs

| Service/category | Repository status | Planning cost |
|---|---|---:|
| Supabase Auth/DB/Storage | Already integrated | Either retain during transition ($25–$599+/mo by plan/usage) or migrate to AWS; do not pay both long-term without reason. |
| Google Gemini | Integrated in server routes | Usage-based; budget included above. Exact model/token rates must be rechecked at contract time. |
| Groq | Integrated as fallback/referenced | Usage-based/optional fallback; set provider-level caps. |
| OpenAI/OpenRouter | Referenced in provider abstraction/backup code, not required by current `.env.example` | Optional. Do not enable multiple paid fallbacks without cost attribution. |
| Resume parsing vendor | Not integrated | Optional $0.05–$0.30/document; $25–$7,500/mo at modeled volumes. Benchmark build-vs-buy. |
| Razorpay | Referenced, checkout disabled | Recommended for India. Typical transaction percentage plus GST; confirm negotiated domestic/international/card/UPI rates. Pass-through fees are excluded from infrastructure totals. |
| SMS/OTP | Not integrated | Optional; prefer email/TOTP initially. ₹0.15–₹0.60/SMS typical volume range plus DLT setup. |
| Error tracking | Not integrated | Optional $0–$300+/mo; CloudWatch can cover launch, SaaS may improve frontend visibility. |
| Product analytics | UI concepts only | Optional $0–$500+/mo; begin privacy-aware and avoid resume content. |
| Support desk | Not integrated | Recommended near launch, $50–$500+/mo. |
| CAPTCHA/bot protection | Not implemented | Recommended selectively; AWS WAF challenge or Turnstile-style product. |
| Identity verification | Not integrated | Optional; per-verification cost only if business need is proven. |
| Job-board/recruitment integrations | Demo/Coming Soon | Optional; commercial terms vary, exclude from base until partners approve access. |

## 10. First-year cost summary

The following is a funding-envelope view. It includes 12 months after launch; development occurs before/overlaps early operating months. Marketing is deliberately separate.

| Category | Lean MVP min / realistic / high | Standard min / realistic / high | Growth-ready min / realistic / high |
|---|---:|---:|---:|
| Product development | $240k / $320k / $400k | $320k / $410k / $520k | $460k / $600k / $780k |
| AWS/IaC setup | $18k / $28k / $40k | $28k / $40k / $58k | $40k / $60k / $85k |
| Security/testing | $25k / $40k / $60k | $40k / $60k / $90k | $65k / $95k / $140k |
| Legal/compliance | $8k / $15k / $25k | $12k / $20k / $35k | $20k / $35k / $60k |
| Domain/launch/docs | $8k / $15k / $25k | $12k / $22k / $35k | $18k / $32k / $50k |
| 12-month AWS | $2.8k / $4k / $7k | $10k / $15k / $25k | $34.7k / $50k / $85k |
| 12-month third-party/AI | $3k / $8k / $18k | $10k / $20k / $45k | $50k / $85k / $160k |
| Maintenance/support | $35k / $55k / $80k | $55k / $80k / $120k | $90k / $140k / $210k |
| **Subtotal before contingency** | **$339.8k / $485k / $655k** | **$487k / $667k / $928k** | **$777.7k / $1.097m / $1.570m** |
| Contingency (15% minimum; realistic 18%; high 20%) | $51k / $87.3k / $131k | $73.1k / $120.1k / $185.6k | $116.7k / $197.5k / $314k |
| **Funding requirement USD** | **$391k / $572k / $786k** | **$560k / $787k / $1.114m** | **$894k / $1.295m / $1.884m** |
| **Funding requirement INR** | **₹3.76cr / ₹5.51cr / ₹7.56cr** | **₹5.39cr / ₹7.57cr / ₹10.72cr** | **₹8.61cr / ₹12.46cr / ₹18.13cr** |

The phase-based expected sum is higher because it prices every named feature. The **recommended funding below assumes disciplined scope reduction**, re-use of viable repository work, and an agency-style blended rate. Marketing/customer onboarding allowance is **separate**: Lean $25k–$50k, Standard $60k–$150k, Growth $200k–$500k; it is not included in the table.

## 11. Recommended investment amount

Recommend **US$420,000–US$570,000 (₹4.04–₹5.49 crore)**, target **US$490,000 (₹4.72 crore)**, for a constrained launch scope and roughly **18 months total runway**: 8–10 months delivery plus 8–10 months launch runway, with operating support continuing through the first production year via staged release/reserve.

It covers core candidate/recruiter workflows, robust auth/RBAC, canonical PostgreSQL schema, secure resume pipeline, a measured ATS/AI feature set, Razorpay billing, essential admin/analytics, AWS production/staging, independent security testing, launch support, initial operating costs and ≥15% contingency. It excludes major paid acquisition, salaries for a permanent post-runway company team, international expansion/legal work, enterprise integrations, native mobile apps, advanced video interviewing and unlimited AI usage.

If less than **$420k** is available, defer career-growth marketplaces, live/video interviews, integrations, sophisticated analytics and non-core AI. Do **not** reduce authorization/RLS, secure file handling, payment/webhook integrity, automated testing, backups/restore testing, observability or independent security review. Underfunding those items creates regulatory, fraud and data-loss exposure rather than a smaller product.

Major financial risks are schema/code rework, unclear MVP boundaries, AI token and fallback multiplication, delayed payment KYC, security findings, data migration quality, and FX movement on cloud/API invoices.

## 12. Milestone-based fund release plan

Amounts use the $490,000 target (₹4.72 crore).

| Milestone | % / amount | Deliverables and verification | Expected period |
|---|---:|---|---|
| Discovery/architecture approved | 10% — $49k / ₹47.15L | Signed scope, ADRs, threat/data model, backlog; independent owner review | Weeks 1–4 |
| Canonical backend and auth foundation | 18% — $88.2k / ₹84.88L | Clean migrations, RLS/RBAC test matrix, staging API, reset/verification; automated test evidence | Months 2–3 |
| Candidate workflows | 15% — $73.5k / ₹70.73L | Profile, resume, search/apply/status/delete E2E acceptance | Months 3–5 |
| Recruiter workflows | 15% — $73.5k / ₹70.73L | Recruiter profile, jobs, applicant review/status E2E acceptance | Months 4–6 |
| AI/resume and payments | 14% — $68.6k / ₹66.02L | Quality/cost benchmark, secure uploads, sandbox billing/webhook reconciliation | Months 5–7 |
| Security, QA and AWS staging | 13% — $63.7k / ₹61.31L | Test report, pen test/retest, IaC, alarms, restore and rollback evidence | Months 7–8 |
| Production launch | 8% — $39.2k / ₹37.72L | Go/no-go signoff, production smoke/performance results, runbooks | Months 8–10 |
| Retained operations reserve | 7% — $34.3k / ₹33.01L | Released against 90-day SLO, incident and cost review | Post-launch months 1–3 |

## 13. Cost risks and controls

- Freeze a launch scope and make every additional feature trade against time/budget.
- Build a canonical schema and authorization suite before expanding UI; current SQL patch accumulation predicts rework.
- Meter AI per feature/user/provider, cap tokens and daily spend, cache safe results, and alert at 50/75/90% of budget.
- Use S3 lifecycle rules, log sampling/redaction and retention tiers; resumes and logs can silently accumulate.
- Apply AWS Budgets and Cost Anomaly Detection per environment and tag every resource.
- Start On-Demand, then use Savings Plans/Reserved Instances only after measured utilisation.
- Keep the AI/provider interface portable; avoid proprietary data formats and retain export capability.
- Make security and QA release gates. Paying to remediate a breach costs far more than testing access control and restore paths.
- Use milestone acceptance and a 15–20% reserve; do not consume contingency for optional feature growth.

## 14. Investor-friendly final summary

| Item | Recommended view |
|---|---|
| Current stage | Broad frontend/MVP with partial Supabase-backed flows; 32% production readiness; not safe for public production |
| Estimated completion | 8–10 months recommended; 7 months minimum with full team; 12–14 months conservative |
| One-time scoped development/setup | Approximately $330k–$430k (₹3.18–₹4.14cr) within recommended envelope |
| Monthly production cost | Lean ~$332; Standard ~$1,584; Growth ~$6,895 including modeled external AI |
| 12-month operating cost | Standard AWS + AI about $19k (₹18.29L), before support and other SaaS |
| Contingency | At least 15%; 18% recommended |
| Recommended total investment | **$420k–$570k (₹4.04–₹5.49cr); target $490k (₹4.72cr)** |
| Expected result | Secure, tested, monitored core recruitment product on AWS—not every prototype concept—capable of a controlled public launch |

### Pricing and evidence notes

AWS sources used: [AWS Pricing Calculator](https://aws.amazon.com/calculator/), [Fargate](https://aws.amazon.com/fargate/pricing/), [RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [CloudFront](https://aws.amazon.com/cloudfront/pricing/), [Route 53](https://aws.amazon.com/route53/pricing/), [WAF](https://aws.amazon.com/waf/pricing/), [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/), [Cognito](https://aws.amazon.com/cognito/pricing/), [SES](https://aws.amazon.com/ses/pricing/) and [AWS Support](https://aws.amazon.com/premiumsupport/pricing/). Prices were checked 21 July 2026 and should be refreshed in the AWS Calculator immediately before an investment decision. Exchange-rate evidence: Reuters, 21 July 2026, USD/INR 96.2350.
