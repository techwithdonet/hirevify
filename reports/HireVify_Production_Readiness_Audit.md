# HireVify Production Readiness Gap Analysis and Remediation Plan

**Internal technical audit — 21 July 2026**  
**Scope:** static inspection of the complete repository at `E:\hirevify-next`; no application code was changed. Secrets were not reproduced or tested. Live Supabase/AWS consoles and production data were not accessed.

## 1. Executive technical assessment

| Measure | Assessment |
|---|---|
| Production readiness | **32%** (evidence-based engineering judgement, not a certification) |
| Technical risk | **Critical / Very High** |
| Maturity | Functional frontend prototype with selected real integrations; pre-production alpha |
| Public release | **No** |
| Real candidate/resume data | **No**, until RLS, private-file controls, retention/deletion, malware handling and legal notices are verified |
| Real payments | **No**; endpoints deliberately return 503 and no webhook implementation exists |
| Reliable recruiter/candidate operations | **No**; key flows are mixed real/mock and have no automated regression coverage |

The strongest implementation is the breadth of UI, Supabase email/password authentication, real client-side services for profiles/jobs/applications, five authenticated AI endpoints, and a server-side admin session/API. The most serious blockers are: no authoritative migration/RLS chain; client-direct privileged business writes whose security depends on unverified policies; disabled payments; unsafe/incomplete upload lifecycle; no automated tests/CI/IaC/operational recovery; mock functionality presented among real workflows; and incomplete identity/account/privacy controls. A fresh `npm run lint` and `npm run build` did not complete within a three-minute audit timeout; this is **not** recorded as a pass or definitive compile failure.

## 2. Repository and architecture review

### Important files examined

- `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `Dockerfile`, `.dockerignore`, `.gitignore`, `.env.example`, `README.md`, `SUPABASE_SETUP.md`.
- Root `app/` layouts/pages/errors/SEO and all active `app/api/**/route.ts` files.
- `src/lib/supabase.ts`, `src/lib/server/{supabaseAuth,aiRequest,aiChat,rateLimit,adminSession,adminSupabase}.ts`.
- `AuthProvider.tsx`, `AuthModal.tsx`, `OTPVerification.tsx`, `AppRouter.tsx`, `PremiumGate.tsx`, `utils/premium.ts`.
- Services for profiles, jobs, applications, saved jobs, subscriptions, assessments, projects, portfolio and career growth.
- Representative candidate/recruiter/admin, ATS/resume, payment, notification, messaging, analytics and integration components.
- All root SQL/migration files, `supabase/functions/cleanup-expired-videos/index.ts`, Vercel metadata and the tracked backup/debug/analysis directories.

### Architecture findings

- Next.js **16.2.10**, React 19.2.4, TypeScript strict mode, App Router rooted at `/app`. The repository also contains `src/app/api/ai/resume-analysis/route.ts`, a duplicate route under the inactive second app tree; this is confusing dead/legacy code.
- Most of the UI is one large client-side application. Many files are very large (`ATSView.tsx` 2,598 lines, `ResumeBuilder.tsx` 2,243, `CandidateProfileEditor.tsx` 2,158), increasing bundle and change risk.
- Business CRUD is mostly direct browser-to-Supabase. This can be secure only with comprehensive, tested RLS. No single versioned migration directory proves the deployed policy state.
- Effective APIs comprise five AI routes, five admin routes, three disabled payment routes and a non-production Supabase diagnostic. There is no general BFF for sensitive jobs/applications/profile mutations.
- Environment files are ignored, and `.env.example` names public Supabase settings, service-role, admin-session and AI variables without values. Local environment files exist; their contents were not included in this report. Vercel metadata shows an existing Vercel project. No AWS deployment config exists.
- `next.config.ts` sets useful CSP, HSTS, frame, MIME and permissions headers. CSP still allows inline scripts/styles; no nonce-based policy or explicit CORS/CSRF strategy is present.
- Docker is multi-stage and non-root, but copies `.next/standalone` while `next.config.ts` does not set `output: "standalone"`; container deployment is therefore unverified.
- There is no middleware/proxy protection, CI workflow, infrastructure as code, formal logger, error tracker, migration runner, rollback automation, test framework or backup/restore code.
- The repository tracks backup API files, theme backups, large debug dumps, copied source trees, zip archives and fix scripts. These increase secret/history leakage and build/context risk even where TypeScript excludes some paths.

## 3. Feature completion matrix

| Feature | Classification | Evidence |
|---|---|---|
| Registration | Functional but incomplete | `AuthProvider.tsx:160–235`; Supabase sign-up then profile/recruiter upsert; no transaction/rollback. |
| Login | Functional but incomplete | `AuthProvider.tsx:282–334`; password login and session load. |
| Password reset | Missing | No reset flow found. |
| Email verification | Functional but incomplete | Supabase metadata is read; `OTPVerification.tsx` exists, but no proven end-to-end enforced verification route/journey. |
| Candidate profile | Functional but incomplete | `CandidateProfileEditor.tsx`, `profilesService.ts`; schema drift patches and no tests. |
| Recruiter profile | Functional but incomplete | `RecruiterProfileEditor.tsx`, `RecruiterSettings.tsx`, `profilesService.ts`. |
| Admin login | Functional but incomplete | `app/api/admin/login/route.ts`; RPC credential check and HMAC cookie. Shared admin role, no MFA. |
| Admin permissions | Functional but incomplete | Session gates admin APIs, but only binary `role: admin`; no scoped roles/audit. |
| RBAC | Functional but incomplete | User role mapping plus RLS dependency; browser navigation is not authorization. |
| Resume upload | Functional but incomplete | `CandidateJobApply.tsx`, `applicationsService.ts`; validation/security controls incomplete. |
| Resume parsing | Functional but incomplete | `app/api/ai/parse-resume/route.ts`; PDF/DOCX parsers; quality and hostile-document testing absent. |
| Resume storage | Functional but incomplete | Supabase Storage buckets referenced; private/public behavior varies and deployed policy is unable to verify. |
| Resume deletion | Functional but incomplete | removal paths exist in `applicationsService.ts`; account-wide guaranteed erasure is missing. |
| ATS matching | Functional but incomplete / mock mix | deterministic and AI services/routes plus numerous experimental/demo scorers. |
| Resume rewriting | Functional but incomplete | authenticated premium AI route; weak output validation and fallback-generated content. |
| AI summary | Functional but incomplete | authenticated premium route; no durable quota/timeout/schema assurance. |
| Job create/edit/delete | Functional but incomplete | `jobsService.ts`, `JobPostingFlow.tsx`; ownership depends on RLS. |
| Job search/detail | Functional but incomplete | `jobsService.ts`, `ProjectSearch.tsx`, candidate detail screens. |
| Applications/status | Functional but incomplete | `applicationsService.ts`, candidate/recruiter views; transaction/idempotency gaps. |
| Recruiter applicant review | Functional but incomplete | `JobApplicants.tsx`, `ATSView.tsx`; access-control tests absent. |
| Assessments | Mock data / partial | Admin API exists; candidate `SkillsAssessment.tsx` includes mock result constants. |
| Notifications | Mock data / partial | `useNotifications.ts` is real; `NotificationCenter.tsx` generates mock notifications. |
| Email delivery | Missing | No SES or other application email service. Supabase auth email may exist externally, unable to verify. |
| Subscription plans | Frontend only / partial | Pricing and subscription service exist; plan endpoint returns no plans/503. |
| Premium access control | Functional but incomplete | `aiRequest.ts` enforces server-side for AI; other UI uses local/browser subscription state. |
| Payments/webhooks | Missing | Payment routes return 503; no webhook/signature/idempotency. |
| Billing history/refunds | Missing | No provider-backed ledger/refund workflow. |
| Analytics/reporting | Frontend only / derived | Recharts dashboards; no event pipeline or authoritative metrics. |
| Audit logs | Missing | A table name appears in SQL, but no production audit-write service or immutable trail. |
| User management | Functional but incomplete | Admin data view and Pro update; no mature lifecycle/role controls. |
| Account deletion | Missing | No complete auth/profile/object/processor deletion workflow. |
| Data export/privacy controls | Missing | No portable export/consent/retention management. |
| Mobile responsiveness | Functional but incomplete | Responsive classes/hooks used; no device/browser test evidence. |
| Accessibility | Functional but incomplete | Radix primitives help; no axe/manual WCAG audit, focus/contrast evidence. |
| SEO | Functional but incomplete | metadata, sitemap, robots and social images exist. |
| Error pages/boundaries | Functional but incomplete | `global-error.tsx`, `not-found.tsx`, `ErrorBoundary.tsx`; inconsistent component-level handling. |
| Loading/empty states | Functional but incomplete | Many local states; inconsistent across broad prototype. |
| Messaging/interviews/integrations | Mock/demo or frontend only | UI components and mock integration utilities; no verified realtime/video provider backend. |

## 4. Critical blockers

| ID | Issue/evidence/affected files | Impact / severity | Remediation / effort / owner / acceptance |
|---|---|---|---|
| P0-01 | No authoritative ordered schema and RLS set; many root SQL patches; browser CRUD throughout `services/*.ts` | Broken access control/data leakage or broken features; **Critical**, high data-loss/privacy risk | Consolidate migrations, constraints, policies; 15–25d DB/backend; requires data inventory. Clean DB applies from zero; negative RLS matrix passes. |
| P0-02 | Real payments absent: `app/api/payments/*` return 503 | Cannot monetize; unsafe to transact; **Critical** | Razorpay checkout + verified idempotent webhooks + ledger/refunds; 15–25d backend/QA/legal. Sandbox reconciliation and replay tests pass. |
| P0-03 | Incomplete upload controls and no malware quarantine/scanning | Malicious files/PII exposure; **Critical** | Private S3/Supabase bucket, magic-byte/MIME/size checks, AV worker, signed URLs, lifecycle/delete; 15–25d backend/AppSec. EICAR and access tests pass. |
| P0-04 | No automated test framework/scripts/CI | Regressions and permission failures undetected; **Critical** | Vitest/RTL + Playwright + API/DB test environment and CI gates; 25–45d SDET/dev. Required suites green on clean clone. |
| P0-05 | No account deletion/export/retention/consent | Cannot responsibly process candidate PII; **Critical** | Data inventory, consent notices, export/delete orchestration, retention jobs; 12–20d backend/legal. Verified processor-wide deletion report. |
| P0-06 | Admin is a shared binary role; no MFA, scoped RBAC or audit trail | Full-system compromise/repudiation; **Critical** | Individual admin identities, MFA, scoped claims, re-auth, immutable audit log; 10–18d backend/AppSec. Privilege matrix and audit evidence pass. |
| P0-07 | Process-local `Map` rate limit (`rateLimit.ts:13–19`) | Bypass on restart/scale; brute-force/AI abuse cost; **High** | Redis/WAF/distributed token bucket, trusted proxy config; 5–8d backend/DevOps. Multi-instance load test enforces quotas. |
| P0-08 | AI handles resumes without durable quotas, timeout/cancellation, schema validation or privacy governance | Spend explosion, hangs, hallucination and PII transfer; **Critical** | Queue, timeouts, strict schemas, metering/caps, redaction/log policy, provider DPA; 12–20d AI/backend/legal. Abuse/cost/invalid-output tests pass. |
| P0-09 | Core flows mix mock and real data (`NotificationCenter`, `SkillsAssessment`, integration/demo AI code) | Users/investors receive misleading state; **High** | Remove/label demo paths and connect launch scope to real services; 10–20d full-stack/QA. Seeded E2E proves provenance. |
| P0-10 | Build/lint not freshly verifiable within timeout; Docker expects standalone output not configured | Deployment failure/unknown release integrity; **High** | Diagnose performance, produce deterministic lockfile build, set correct Docker output, CI artifact/SBOM; 5–12d lead/DevOps. Clean CI build < agreed threshold and image smoke test. |

P0 means no public use. P1 issues appear in the roadmap (§18) and must close before launch.

## 5. Authentication and authorization audit

- Supabase manages password hashing/session tokens; the browser signs up and signs in directly. Minimum length is eight, but strength/breached-password policy is external and unverified.
- `AuthProvider.tsx` mirrors a user object and access token into `localStorage`. Supabase also maintains its own session. This enlarges XSS impact and creates stale dual state; remove custom token persistence and rely on supported session handling.
- No password-reset implementation, MFA, account lockout, device/session UI or forced verification gate was found.
- Role is read from `profiles`/metadata and client routing selects dashboards. Server authorization exists for AI premium routes and admin APIs, but most domain operations rely exclusively on database RLS.
- The service-role key is confined to `server-only` admin client code, which is good; local key existence was observed only by name. Rotate if repository/debug history ever contained values and enforce secret scanning.
- Admin session is HMAC-signed, HttpOnly, Secure in production, SameSite Strict and eight hours. Weaknesses: shared credential RPC, binary role, no session identifier/revocation/MFA/audit, process-local login throttling.
- No middleware/proxy protects UI routes. UI protection is convenience only; data/API security must remain server/RLS-based.
- Premium AI endpoints query the subscription server-side. Other premium presentation/state uses local storage and must never be used as entitlement authority.
- Deployed RLS/database grants were not accessible; authorization is therefore **unable to verify**, which is itself a launch blocker.

## 6. Database audit

The code references profiles, candidate/recruiter profiles, jobs, applications, saved jobs, subscriptions, notifications, assessment tables, portfolio items, project assignments, career-growth tables and storage buckets. Root SQL files create many tables, but the history is a collection of full migrations, fixes and feature patches rather than one deterministic chain.

Notable naming/schema discrepancies include `skills_assessments` and `assessment_questions` referenced by active admin APIs versus migrations containing other assessment names; `candidate_portfolio_items` in service code versus `portfolio_items` in detected DDL; and storage bucket names used as if database relations in some searches. These must be confirmed against live schema, not guessed.

Risks: missing/duplicate constraints, profile ID versus auth-user ID ambiguity, nullable ownership fields, counter drift (`applications_count`), non-transactional multi-step registration/apply/assessment updates, inconsistent timestamps/status enums, unknown indexes on filters/joins, and unknown RLS coverage. No application-controlled backup/restore or retention system exists.

Required: adopt `supabase/migrations/<timestamp>_*.sql` or an AWS migration tool; baseline live schema; remove duplicate patches; add FKs, unique constraints, CHECKs and indexes from real query plans; transactionally update coupled rows; test every RLS action for candidate/recruiter/admin/anonymous; use separate dev/stage/prod projects/databases; document PITR and quarterly restore tests.

## 7. API and backend audit

| Route group | Purpose/readiness | Auth/authz | Validation, reliability and privacy gaps |
|---|---|---|---|
| `POST /api/ai/{parse-resume,ats-match,resume-analysis,generate-summary,rewrite-resume}` | Real provider calls/fallbacks; **incomplete** | Bearer token + server premium check | Some Zod/size validation; no distributed quota, queue, idempotency, consistent strict output schema, guaranteed timeout/retry policy or safe observability. Resume PII leaves the platform. |
| `POST /api/admin/login`, logout | Admin session; **incomplete** | DB RPC credential -> signed cookie | Local IP limiter; no MFA/revocation/audit. Validate trusted forwarded IP chain. |
| `GET/PATCH /api/admin/data` | Read core tables/manual Pro changes; **incomplete** | Admin cookie + service role | 1,000-row loads, service-role blast radius, no fine-grained roles, audit or pagination. Errors may expose schema details. |
| `/api/admin/assessments` | CRUD assessments/questions; **incomplete** | Admin cookie | Zod is positive; multi-step replace is non-transactional and can leave partial data. |
| `/api/admin/health` | Deep service/table/bucket checks; **incomplete** | Admin cookie | Useful but potentially expensive/information-rich; add shallow public health and restricted readiness. |
| `/api/payments/*` | Disabled placeholders; **missing** | None needed currently | Always 503; no checkout/webhook/signature/retry/idempotency. |
| `/api/supabase-test` | Development diagnostic | Production returns 404 | Remove from production artifact; error details should remain redacted. |
| Duplicate `src/app/api/ai/resume-analysis` | Inactive/dead duplicate | Older implementation differs | Delete after history review to avoid patching wrong route. |

No API response-contract framework, correlation IDs, central structured logs, consistent timeouts, retry budgets, idempotency keys or OpenAPI inventory exists. All mutation endpoints require body limits independent of `Content-Length`, because chunked bodies can omit it.

## 8. AI feature audit

Strengths: keys are server environment variables; requests authenticate; AI routes have a 256 KiB advertised body cap; premium is checked server-side; several prompts prohibit fabricated experience; providers are abstracted/fallback capable.

Gaps: resume/job text is interpolated directly into prompts, so prompt injection is expected; JSON extraction locates braces but several routes do not validate every field/range; provider calls may retry/fallback and multiply cost; no durable per-user/month quota, token ledger, request idempotency, cancellation, circuit breaker, content safety, model-version audit, evaluation corpus or hallucination disclosure exists. Raw error logging and provider handling may expose candidate PII. Fallback resume rewriting can create generic content that appears AI-derived even when both providers fail.

Controls: isolate user text as untrusted data, require JSON-schema output and post-validate; queue long work; 20–60 second provider timeout and bounded retry with jitter; per-user/tenant/daily global budgets; explicit consent and processor disclosure; do not train on resumes by default; redact logs; encrypt minimal inputs/outputs with retention; human-review labels; benchmark extraction/ATS accuracy on licensed, diverse resumes; monitor drift, latency, cost and refusal rate.

## 9. Payment and subscription audit

The current payment system is **not safe or capable of real transactions**. Plan/health/order routes explicitly state Razorpay is not ready and return 503. There is no checkout order creation, webhook endpoint, signature verification, event ledger, idempotency, expiry reconciliation, failed-payment/dunning, refund, invoice, tax/GST, currency or live/test isolation logic. Admin can manually grant one-year Pro access, and browser subscription state can affect presentation.

Implement a server-owned entitlement state machine. Never activate from a browser callback. Persist provider event ID uniquely; verify raw webhook signature; process idempotently; reconcile scheduled status; separate payment ledger from entitlement; support refund/chargeback/expiry; record INR minor units and tax fields; expose billing history; secure sandbox/live secrets separately; obtain finance/legal advice for GST, invoices and payment-provider terms.

## 10. Security audit

Positive controls include strict TypeScript, server-only key modules, authenticated AI/admin endpoints, Zod on several routes, HttpOnly admin cookie, non-root container and useful security headers.

Material gaps:

- **Broken access control/IDOR:** client services accept record/user/recruiter IDs and depend on unverified RLS. Every select/update/delete must have ownership/role negative tests.
- **Secrets:** `.env*` is ignored and no values are reported, but debug dumps/backups/zip archives are tracked. Add pre-commit/CI secret scans and rotate any historically exposed keys.
- **XSS:** large client surface, localStorage token copy and third-party content increase impact. CSP permits inline script/style; sanitize any rendered rich text and move toward nonce/hash CSP.
- **CSRF:** SameSite Strict helps admin cookies, but add Origin/Host checks or CSRF tokens for cookie-authenticated mutations.
- **SSRF/open redirects:** URL fields and future integrations need allow-listing and server egress controls. No active generic fetch endpoint was proven, but risk rises with integrations.
- **Uploads:** extension/MIME checks are insufficient; no malware scan, decompression limits or content-disarm path.
- **Rate limiting/DoS:** in-memory limits do not work across tasks; expensive parse/AI and admin health endpoints need distributed protection and WAF/body limits.
- **Logging:** widespread `console.error` lacks redaction/correlation and may leak provider/database information; no audit trail.
- **Dependencies:** `npm audit` did not complete within audit timeout; generate SBOM and run audited dependency/security scans in CI. Overrides for DOMPurify/PostCSS show prior remediation but are not proof of current safety.
- **CORS/security headers:** no explicit public cross-origin API requirement; default same-origin is preferable. Header coverage is good but must be verified at CDN/ALB after deployment.

No vulnerabilities were exploited.

## 11. File upload and resume-data audit

The repository supports PDF/DOCX-style parsing and storage paths, but production controls are incomplete. Enforce an allow-list (PDF and DOCX only at launch), maximum compressed and extracted size, magic bytes plus MIME and extension consistency, filename replacement with server UUID, antivirus scan in quarantine, parser sandbox/time/memory limits, zip-bomb protection, private encrypted storage, short-lived signed URLs, ownership checks, duplicate hash policy, and lifecycle retention.

Do not use public URLs for resumes. Downloads should be authorized and audited. Deletion must remove database references, every object/version/derived text/AI output and downstream processor copies subject to lawful retention. Define consent, recruiter-access scope, retention after application closure, breach response and data-subject request SLA. Test malicious, corrupt, password-protected, oversized and polyglot documents.

## 12. Code quality and maintainability

- Strict TS is positive, but `allowJs` and disabled `no-explicit-any` permit broad escape hatches. Many services/components use `any` and weak runtime contracts.
- Extreme component sizes and duplicate ATS/AI implementations make ownership and regression difficult. Split by domain and retire experiments only after tests preserve intended behavior.
- Mock data, localStorage persistence, placeholder calculations and `Math.random()` IDs exist in production-reachable source.
- Error/loading/empty state handling is inconsistent and often logs directly to console.
- Database mapping repeatedly accommodates both profile IDs and auth IDs, indicating unresolved domain identity design.
- README is the default Next.js scaffold and does not document architecture, schema, environments, security, deploy, restore or operations.

Files/directories that should not enter a production source/build context include `.theme-backups/`, `compare-projectsearch/`, `resume-builder-analysis-files/`, `resume-builder-final-needed/`, corresponding zip files, `app/api/ai/generate-summary/*.bak*`, root debug dumps, fix scripts and stray zero-byte shell-artifact files. Preserve history in Git or an external archive, not the deployment context.

## 13. Testing audit

No executable automated test suite or test script was found. Files named connectivity/integration `*-test.tsx` are interactive diagnostic utilities, not Jest/Vitest/Playwright tests. The minimum launch plan is:

1. Unit tests for role/entitlement/status/ATS deterministic logic, validators and mapping.
2. Component tests for auth/forms/upload/payment states and accessibility.
3. API contract tests for every status/body/auth path, limits, timeout and redaction.
4. Database migration/constraint/index tests on a clean database plus RLS allow/deny matrix.
5. Auth tests: verification/reset/session expiry/revocation/multiple devices/brute force.
6. Payment sandbox tests: valid/invalid signatures, duplicate/out-of-order events, fail/refund/expire/reconcile.
7. AI tests: injection corpus, malformed/oversized inputs, schema failure, fallback, quota, provider timeout and cost cap.
8. Upload tests: MIME spoof, EICAR, zip bomb, corrupt/encrypted/oversized docs, unauthorized download/delete.
9. Playwright E2E for candidate, recruiter and admin critical paths on mobile/desktop.
10. axe/manual keyboard/screen-reader checks; Lighthouse/Web Vitals budgets.
11. Load/soak tests for login/search/apply/upload/AI queues and database connection limits.
12. SAST/dependency/container/IaC/secret scans, independent penetration test, backup restore and regional-recovery exercise.

Launch gate: all P0/P1 tests green, zero open critical/high exploitable findings, critical-path E2E stable, restore and rollback demonstrated, and product owner/security/operations sign-off.

## 14. DevOps and AWS readiness

Current state is Vercel-oriented metadata plus an unverified Dockerfile. Required AWS work: separate dev/stage/prod accounts or at least isolated VPC/data/secrets; trunk-based or short-lived branch policy with protected main; CI quality/security gates; ECR image/SBOM/signing; Terraform/CDK; ECS/ALB/CloudFront/WAF; RDS private subnets; S3 private endpoints/buckets; Secrets Manager/KMS; least-privilege task roles; migration job; rolling deployment with health gates and rollback; CloudWatch structured logs/metrics/traces; pager alerts and runbooks; AWS Backup/PITR/restore tests; Route 53/ACM; CloudTrail/GuardDuty; AWS Budgets and Cost Anomaly Detection.

Use rolling ECS deployment initially; blue/green is justified once database compatibility discipline exists. Migrations must be backward-compatible across the deployment window. Define SLOs, RTO/RPO, log retention, on-call ownership and incident severity before launch.

## 15. Performance and scalability

Likely bottlenecks are the large client bundle from broad `use client` boundaries; huge component modules and duplicate libraries; browser-side PDF parsing; unpaginated/large admin reads; direct Supabase joins and sequential fallbacks; repeated profile/auth-ID resolution; AI latency and fallback multiplication; synchronous file work; and process-local rate limits.

Measure route-level bundles and Web Vitals; dynamically import heavy ATS/PDF/chart/video modules; keep static/marketing paths server-rendered; paginate and index search; profile SQL with `EXPLAIN`; remove counter N+1/update races; queue CPU/AI work; use signed multipart upload; limit concurrency; monitor DB connections; add RDS Proxy only if measurements require it; cache public job search safely; use CloudFront for immutable assets. Horizontal ECS scaling requires shared rate limits, queue state and compatible caching.

## 16. Privacy, legal and compliance gaps

HireVify processes identity, employment history, education, contact details, resumes, recruiter decisions and AI-derived scores. It needs qualified counsel to finalise: privacy notice, terms, cookie notice/consent where applicable, lawful basis and granular consent, data retention schedule, account deletion/export, employer/recruiter access rules, resume ownership/license, automated/AI processing disclosure and contestability, subprocessor list and DPAs, cross-border transfer mechanism, security incident/breach response, payment/provider terms, accessibility obligations and age/minor policy.

Create a data inventory/record of processing, DPIA for AI screening, data-subject request workflow, incident contacts and processor deletion verification. Avoid protected-attribute inference and audit ATS/AI outcomes for disparate impact. **Final legal documents and India/international compliance decisions require a qualified legal professional.**

## 17. UX and accessibility audit

The UI is broad and visually developed, uses responsive utility classes and accessible Radix primitives, and has explicit loading/error components. Risk remains because no systematic WCAG test exists, flows are long/large, mock/real provenance is unclear, and complex dashboards/modals/video/upload/drag interactions need keyboard and screen-reader verification.

Before launch: test 320px–desktop layouts and major browsers; enforce labels/descriptions/errors tied to controls; visible focus and focus return; skip links/landmarks/headings; contrast and reduced motion; keyboard alternatives for drag/drop; live regions for async status; recoverable form drafts; consistent empty/error/loading/offline states; accessible tables/charts; plain-language candidate/recruiter onboarding; and an admin workflow optimised for safe high-impact actions with confirmation and audit context.

## 18. Prioritised remediation roadmap

P0 items are detailed in §4. The complete launch roadmap counts **10 P0 and 16 P1** issues.

| Task | Priority / severity | Relevant area | Implementation / effort / role | Dependencies / acceptance / phase / blocks? |
|---|---|---|---|---|
| P0-01 Canonical schema/RLS | P0 Critical | SQL, all services | 15–25d DB/backend | Inventory; clean apply + negative matrix; Ph2; Yes |
| P0-02 Payments | P0 Critical | payment routes/subscriptions | 15–25d backend/QA | Auth/schema/provider; sandbox reconciliation; Ph6; Yes |
| P0-03 Secure uploads | P0 Critical | apply/storage/parsers | 15–25d backend/AppSec | S3/queue; malicious-file suite; Ph5/8; Yes |
| P0-04 Automated tests/CI | P0 Critical | whole repo | 25–45d SDET/dev | Stable contracts; release gate green; Ph9/10; Yes |
| P0-05 Privacy lifecycle | P0 Critical | profiles/storage/AI | 12–20d backend/legal | Data map; export/delete proof; Ph8; Yes |
| P0-06 Admin identity/RBAC/audit | P0 Critical | admin/server | 10–18d backend/AppSec | Identity design; MFA/negative matrix; Ph3/7; Yes |
| P0-07 Distributed abuse controls | P0 High | rateLimit/AI/login | 5–8d backend/DevOps | Redis/WAF; multi-task load test; Ph8/10; Yes |
| P0-08 AI safety/cost/privacy | P0 Critical | AI routes/libs | 12–20d AI/backend | Queue/legal; schema/quota tests; Ph5/8; Yes |
| P0-09 Remove/label mocks | P0 High | notifications/assessment/integrations | 10–20d full-stack/QA | Scope freeze; provenance E2E; Ph1/4; Yes |
| P0-10 Deterministic build/image | P0 High | config/Docker/build | 5–12d lead/DevOps | Dependency cleanup; CI image smoke; Ph0/10; Yes |
| P1-01 Password reset/verification | P1 High | AuthProvider/Auth UI | 5–8d full-stack | Auth design; E2E; Ph3; Yes |
| P1-02 Session/token cleanup | P1 High | AuthProvider | 3–5d frontend/security | Auth tests; no custom token localStorage; Ph3; Yes |
| P1-03 Server-owned domain mutations | P1 High | services/API | 15–30d backend | Schema/RBAC; contract tests; Ph2/4; Yes |
| P1-04 Transaction/idempotency integrity | P1 High | registration/apply/assessment | 8–15d backend/DB | Canonical schema; failure injection passes; Ph2/4; Yes |
| P1-05 Email notifications | P1 Medium | notifications/auth | 8–12d backend/DevOps | SES/domain; bounce tests; Ph4/10; Yes |
| P1-06 Observability/redaction | P1 High | all routes/components | 8–12d DevOps/backend | Data classification; traced incidents without PII; Ph8/10; Yes |
| P1-07 AWS IaC/staging/prod | P1 Critical | deployment | 20–35d DevOps | Architecture; reproducible deploy; Ph10; Yes |
| P1-08 Backup/restore/DR | P1 Critical | RDS/S3/runbooks | 5–10d DB/DevOps | AWS env; measured restore meets RPO/RTO; Ph10; Yes |
| P1-09 Security scans/pen test | P1 Critical | whole system | 8–15d AppSec | Staging complete; critical/high closed/retested; Ph8/9; Yes |
| P1-10 Performance/bundle/load | P1 High | client/API/DB | 10–18d performance/full-stack | Stable flows; budgets/SLO pass; Ph9; Yes |
| P1-11 Accessibility remediation | P1 High | all journeys | 10–20d UX/frontend/QA | Design system; WCAG audit gates; Ph1/9; Yes |
| P1-12 Status/error contracts | P1 Medium | services/UI/APIs | 6–10d full-stack | API contracts; consistent recoverability; Ph1/2; Yes |
| P1-13 Repository hygiene/docs | P1 Medium | backups/debug/README | 4–7d lead | Secret/history review; clean artifact/SBOM/docs; Ph0/10; Yes |
| P1-14 Reconcile identity IDs | P1 High | profiles/services | 5–10d DB/backend | Migration; one canonical owner key; Ph2; Yes |
| P1-15 Legal documents/consent | P1 Critical | product/legal | 8–15d legal/product/dev | Data map/DPIA; counsel-approved UI/docs; Ph8; Yes |
| P1-16 Launch/runbook/support | P1 High | operations | 6–10d PM/DevOps/support | All gates; drill and owner signoff; Ph11; Yes |
| P2-01 Component/domain refactor | P2 Medium | large components | 25–45d frontend/lead | Tests first; reduced bundles/churn; post-core; No |
| P2-02 Analytics event model | P2 Medium | dashboards | 12–20d data/full-stack | Privacy/metrics; reconciled funnel; Ph7; No |
| P2-03 Cost optimisation | P2 Medium | AWS/AI | 5–10d FinOps/AI | 60–90d metrics; unit economics dashboard; Ph12; No |
| P2-04 Advanced admin roles | P2 Medium | admin | 8–15d backend | Core RBAC; least privilege roles; Ph7/12; No |
| P3-01 Integrations/video/marketplace | P3 Variable | demo concepts | product-specific | Product evidence/contracts; separate acceptance; after launch; No |

## 19. Timeline to production

- **Minimum realistic:** 7 months with a dedicated 7–9 person team, hard scope cut and immediate decisions.
- **Recommended:** 8–10 months with lead/PM, two backend/full-stack, two frontend/full-stack, QA/SDET, DevOps, part-time UX, DB, AppSec, AI and legal.
- **Conservative:** 12–14 months for freelancer-heavy staffing, schema surprises, payment onboarding or substantial migration.

Critical path: scope/data model → canonical migrations/RLS → auth/RBAC → core workflows → upload/AI/payment integrity → automated tests/security → AWS staging/restore/load → production launch. UI/accessibility, AWS foundations, legal discovery and test harness setup can begin in parallel after discovery; pen testing and final performance testing require stable staging. Largest uncertainties are live Supabase schema/RLS/data quality, mock-to-real scope, parser/AI quality targets, payment KYC/tax decisions and fresh build performance.

## 20. Final production launch checklist

| Area/check | Status | Evidence/action |
|---|---|---|
| Launch scope and acceptance criteria | Incomplete | Broad prototype; needs freeze |
| Core candidate journey E2E | Incomplete | Partial real services, no automated E2E |
| Core recruiter journey E2E | Incomplete | Partial real services, no automated E2E |
| Registration/login | Incomplete | Implemented but untested production policy |
| Reset/verification/MFA | Not started/incomplete | Reset/MFA absent |
| Server RBAC and RLS matrix | Unable to verify | Deployed policies not inspected |
| Canonical schema/migrations | Incomplete | Fragmented root SQL patches |
| Constraints/index/query review | Incomplete | No clean migration/query-plan evidence |
| Payment checkout/webhooks/refunds | Not started | Routes return 503 |
| AI schema/timeout/quota/evaluation | Incomplete | Auth exists; controls incomplete |
| Private uploads/malware scan | Incomplete | No quarantine/AV evidence |
| Account export/deletion/retention | Not started | Missing |
| Security headers | Incomplete | Good baseline; deployment verification/CSP hardening needed |
| Distributed rate limits/WAF | Not started | In-memory only |
| Unit/component/API/DB/E2E tests | Not started | No framework/scripts |
| Accessibility audit | Not started | No evidence |
| Performance/load test | Not started | No evidence |
| Dependency/container/SAST scans | Unable to verify | Audit timed out; no CI |
| Independent pen test/retest | Not started | Required |
| AWS IaC/dev-stage-prod | Not started | No AWS config |
| CI/CD/rollback | Not started | No workflow |
| Structured monitoring/alerts | Not started | Console logging only |
| Backups/PITR/restore drill | Unable to verify | External Supabase state unknown |
| RPO/RTO/DR runbook | Not started | Missing |
| Domain/DNS/SSL/SES | Incomplete | Vercel project exists; AWS/SES absent |
| Privacy/terms/cookies/AI notice | Unable to verify | Counsel review required |
| Architecture/ops/user docs | Incomplete | README is default scaffold |
| Support/on-call/incident response | Not started | Ownership/runbooks absent |
| Final product/security/ops approval | Not started | Depends on all blockers |

## 21. Final honest verdict

- **Is HireVify production-ready?** No. Estimated readiness is 32%.
- **Can it safely accept real candidate data?** No, not until authoritative RLS, secure private uploads, retention/deletion, privacy notices and security testing are complete.
- **Can it safely process real payments?** No. Payment processing is intentionally disabled and the required integrity controls do not exist.
- **Can it reliably support recruiters and candidates?** No. Some flows are functional, but mock/real mixing, schema uncertainty and absent automated tests make reliability unproven.
- **Five most urgent actions:** (1) freeze launch scope and baseline the live schema/data; (2) create canonical migrations plus exhaustive RLS/RBAC tests; (3) implement secure auth/account/privacy and file lifecycles; (4) build automated tests/CI and deterministic AWS staging; (5) implement provider-verified payments and harden AI with quotas, schemas and privacy controls.
- **Estimated work remaining:** about 405–670 person-days for the full requested phase set; a focused launch scope requires roughly 8–10 calendar months.
- **Required team:** technical lead/PM, two backend/full-stack, two frontend/full-stack, QA/SDET, DevOps; fractional UX, database, AppSec, AI and legal specialists.
- **Before showing investors a live production release:** all 10 P0 and 16 P1 tasks must close; payment and data processing must be real and accurately labelled; clean CI build/test/security evidence, restore/rollback drill, production monitoring and legal/operational approvals must exist. Until then, demonstrate only with synthetic data in a clearly labelled non-production environment.

## Audit limitations and evidence standard

Claims are based on current repository source, configuration, SQL and observable commands. A UI label was never treated as proof of a working feature. Live Supabase schema/RLS/buckets/backups, provider dashboards, AWS/Vercel runtime settings, external email configuration and legal documents were not available, so they are marked unable to verify. Static inspection cannot certify absence of vulnerabilities. The audit safely avoided exploiting issues and did not disclose secret values.
