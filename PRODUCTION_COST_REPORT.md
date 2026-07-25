# HireVify — Production Cost Report
**Prepared:** July 20, 2026  
**Purpose:** 1-Year expense estimate + future charges for production launch  
**Note:** This is analysis only — no code or configuration was modified.

---

## 1. Project Overview

**Tech Stack Detected:**
- **Frontend:** Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind CSS v4, MUI v9, Radix UI
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **AI:** Google Gemini API (currently `gemini-2.5-flash-lite`; see §4 for deprecation warning)
- **Hosting:** Vercel (project: `live`, team ID: `team_7tW47cODO33qVBa00lzgyiL1`)
- **Domain:** `hirevify.com`
- **Containerization:** Docker-ready (multi-stage Dockerfile present)
- **Payments:** Razorpay stubbed in code but **not yet enabled**
- **Realtime:** Supabase Realtime active
- **Analytics:** Recharts (client-side)
- **Document Processing:** PDF.js, jsPDF, mammoth, html2canvas
- **Auth:** Supabase Auth (email/password)
- **File Storage:** Supabase Storage (for resumes, portfolio attachments, video submissions)
- **SQL Migrations:** 17 migration files tracked in `/supabase/` and root

**Scale Context (from codebase):**
- 16 database tables (profiles, jobs, applications, portfolios, assessments, subscriptions, notifications, conversations, messages, activity_logs, cv_evaluations, etc.)
- 6 Supabase service layers built (`jobsService`, `applicationsService`, `portfolioService`, `savedJobsService`, `subscriptionsService`, `profilesService`)
- Supabase integration at **64% complete** (19/28 phases done — dashboards still have mock data to wire up)
- AI endpoints: 4 (`/api/ai/resume-analysis`, `/api/ai/rewrite-resume`, `/api/ai/parse-resume`, `/api/ai/generate-summary`, `/api/ai/ats-match`)
- 2 admin API endpoints (`/api/admin/`, health + data)

---

## 2. Current Monthly Running Costs

> These are the baseline costs if you went live today on a minimal production footprint.

| Service | Plan | Monthly Cost | Notes |
|---|---|---|---|
| **Vercel** | Pro (1 seat) | **$20.00** | $20/seat/mo, includes 1TB bandwidth, 10M edge requests, 1M function invocations, 1,000 build minutes |
| **Supabase** | Pro | **$25.00** | First project included; $10 compute credit applies; includes 8GB DB, 100GB storage, 250GB egress, 100K MAU |
| **Google Gemini API** | Pay-as-you-go | **~$3–15** | Variable by usage; see §4 for model-specific breakdown |
| **Domain** (.com) | Annual | **~$1.25** | $15/year; renewal via Namecheap/Porkbun |
| **SSL Certificate** | — | **$0** | Included with Vercel |
| **Email (Transactional)** | TBD | **$0–25** | Not yet configured; see §5 |
| **Error Tracking** | TBD | **$0–30** | Sentry or similar not yet added; see §6 |
| **Monitoring** | TBD | **$0** | Vercel built-in basic monitoring; Observability Plus ~$1.20/M events if added |
| **Total (minimal)** | | **~$49–72 /mo** | |

**Annual baseline (minimal, excl. AI overage & email):** ~$588–864

---

## 3. Year 1 Detailed Cost Breakdown

### 3.1 Vercel Hosting — $240/year base

| Item | Base Cost | Overage Assumptions | Year 1 Estimate |
|---|---|---|---|
| Pro plan (1 seat) | $20/mo × 12 | Fixed | **$240** |
| Bandwidth | 1TB included | 50GB/mo traffic (light prod) → all within limit | $0 |
| Edge Requests | 10M included/mo | 1M/mo requests → all within limit | $0 |
| Function Invocations | 1M included/mo | ~200K/mo → all within limit | $0 |
| Build minutes | 1,000 included/mo | 60 deploys × 5 min avg = 300 min → all within limit | $0 |
| **Subtotal** | | | **$240** |

> **Scaling note:** If you hit 500K visitors/month with heavy AI usage, Fast Origin Transfer adds ~$0.06/GB. At 50GB/mo that's ~$36/year additional. At 5M visitors, bandwidth alone could hit $540/year in overage.

### 3.2 Supabase — $300/year base

| Item | Base Cost | Included | Year 1 Estimate |
|---|---|---|---|
| Pro plan | $25/mo × 12 | Fixed base | **$300** |
| Compute credit | –$10/mo credit | Applied each month | $0 net (absorbs Small compute) |
| Database storage | 8GB included | ~2GB used at launch | $0 |
| File storage | 100GB included | ~5GB at launch (resumes, portfolios) | $0 |
| Egress | 250GB included/mo | ~20GB/mo at launch | $0 |
| MAU | 100K included | <1K at launch | $0 |
| Edge Functions | 2M included/mo | <50K at launch | $0 |
| **Subtotal** | | | **$300** |

> **Scaling note:** Supabase overages are where costs grow. At 10K MAU + 500GB egress/mo + 50GB storage: add ~$60–100/month. At 50K MAU: add ~$130/month on MAU alone. Plan for this as user growth happens.

### 3.3 Google Gemini AI — $36–720/year

**⚠️ Critical: Your current model (`gemini-2.5-flash-lite`) is being deprecated on October 16, 2026.**

**Current model pricing** (`gemini-2.5-flash-lite`):
- Input: **$0.10 / 1M tokens**
- Output: **$0.40 / 1M tokens**

**Usage estimate (3 traffic tiers):**

| Tier | MAU | AI Req/User/Mo | Avg Tokens/Req | Input Tokens/Mo | Output Tokens/Mo | Monthly AI Cost |
|---|---|---|---|---|---|---|
| 🚀 Launch (0–3 mo) | 500 | 3 | 1,000 | 1.5M | 0.5M | **$1.70** |
| 📈 Growth (3–9 mo) | 2,000 | 5 | 1,500 | 15M | 5M | **$17.00** |
| 🚀 Scale (9–12 mo) | 5,000 | 8 | 2,000 | 80M | 20M | **$88.00** |

> The above uses conservative token counts. Resume analysis + ATS scoring + rewriting at full document length (a 2-page resume ≈ 1,500–2,000 tokens input, 500–800 output). If your AI calls are more token-heavy or you use the deprecated `gemini-2.5-flash` at $0.30/$2.50, multiply by ~5x.

**Year 1 AI total estimate:** **$36–1,056** depending on growth trajectory.

### 3.4 Domain — $15/year
`.com` via Namecheap/Porkbun: ~$12–15/year, renews annually.

### 3.5 Transactional Email — $0–288/year
Not yet configured. Recommended providers:

| Provider | Free Tier | Paid |
|---|---|---|
| **Resend** | 3,000 emails/mo free | $20/mo for 50K emails |
| **Mailgun** | 5,000 emails/mo free (3 months) | ~$35/mo thereafter |
| **SendGrid** | 100 emails/day free | $15/mo for 40K emails |
| **Postmark** | No free tier | $45/mo for 25K emails |

HireVify use case: onboarding emails, application notifications, password resets. At 1,000 MAU with 2 emails/user/month = 24,000 emails/month. **Budget $15–25/month.**

### 3.6 Error Tracking & Monitoring — $0–360/year

| Tool | Free Tier | Paid |
|---|---|---|
| **Sentry** | 5K events/mo, 7-day retention | $26/mo for 100K events |
| **Highlight** | 500 sessions/mo | $99/mo |
| **LogRocket** | 1K sessions/mo | $50/mo for 10K |
| **Better Uptime** | 10 monitors free | $15/mo for 10 |

**Recommendation:** Sentry on free tier is sufficient for solo dev launch. Budget $0–26/month.

### 3.7 Payment Gateway (Razorpay) — Future, not yet enabled

Code is stubbed in `.env.example` but intentionally disabled:
> *"Razorpay is intentionally not enabled yet. Do not add checkout keys until the server-side order creation and webhook verification flow is ready."*

Razorpay charges ~2% + GST per transaction. For a job board:
- Recruiter subscription payments
- Assessment/screening upcharges
- No direct per-transaction cost to you beyond the % fee (it's passed through)

---

## 4. ⚠️ Critical Production-Readiness Issues

### Issue #1 — Gemini Model Deprecation (HIGH PRIORITY)
Your current `.env.local` sets:
```
GEMINI_MODEL=gemini-2.5-flash-lite
AI_PROVIDER=gemini
```
Gemini 2.5 Flash (`$0.30/$2.50`) is **scheduled for deprecation on October 16, 2026**. While 2.5 Flash-Lite (`$0.10/$0.40`) may have a different sunset date, the **Gemini 3.5 Flash** is now the recommended model at **$1.50 input / $9.00 output per 1M tokens** — roughly **4–15x more expensive** than Flash-Lite.

**Action required before Oct 2026:** Update to `gemini-3.5-flash` or `gemini-2.5-flash-lite` and recalculate AI budget.

### Issue #2 — Supabase Integration 64% Complete
The dashboards (`CandidateDashboard`, `RecruiterDashboard`) still use mock data. Going live without wiring real Supabase queries means users see fake stats. See `IMPLEMENTATION_STATUS.md` for the remaining 9 items.

### Issue #3 — Payment Flow Not Built
`.env.example` explicitly notes Razorpay is not wired. No revenue can be collected without completing:
1. Server-side order creation
2. Checkout page
3. Webhook handler for payment verification
4. Subscription activation in Supabase `subscriptions` table

### Issue #4 — No Error Tracking
No Sentry or equivalent integrated. Production errors will be invisible.

### Issue #5 — No Email Service Configured
User onboarding, password resets, application notifications — all need a transactional email provider (Resend recommended, easiest Supabase integration).

### Issue #6 — `ADMIN_SESSION_SECRET` in `.env.local` is a Static Secret
This admin auth key is hardcoded. For production, generate a new cryptographically secure secret and rotate it.

### Issue #7 — `.env.local` Exposed in Repo Scan
`SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_SESSION_SECRET` appear in `.env.local`. Ensure this file is in `.gitignore` (it is, per the file list) and **never committed**. The `.env.local.broken-after-vercel-pull` file suggests some env management friction — worth cleaning up.

---

## 5. Complete Year 1 Cost Summary

### Scenario A — Lean Launch (0–3K MAU Year 1)
*You go live with minimal traffic, using free/cheap tiers where possible.*

| Category | Monthly | Year 1 |
|---|---|---|
| Vercel Pro (1 seat) | $20 | $240 |
| Supabase Pro | $25 | $300 |
| Gemini AI (low usage avg) | $3 | $36 |
| Domain (.com) | $1.25 | $15 |
| Transactional Email (Resend free tier) | $0 | $0 |
| Error Tracking (Sentry free) | $0 | $0 |
| **Lean Total** | **~$49** | **~$591** |

### Scenario B — Moderate Growth (3K–10K MAU by Year End)
*Some traction, AI usage growing, email on paid plan.*

| Category | Monthly | Year 1 |
|---|---|---|
| Vercel Pro (1 seat) | $20 | $240 |
| Supabase Pro + small overage | $35 | $420 |
| Gemini AI (mid usage avg) | $20 | $240 |
| Domain (.com) | $1.25 | $15 |
| Transactional Email (Resend paid) | $20 | $240 |
| Error Tracking (Sentry free) | $0 | $0 |
| **Moderate Total** | **~$96** | **~$1,155** |

### Scenario C — Fast Growth (10K+ MAU by Year End)
*Real traction, heavy AI usage, Supabase overages kick in.*

| Category | Monthly | Year 1 |
|---|---|---|
| Vercel Pro (1 seat) | $20 | $240 |
| Supabase Pro + large overage | $80 | $960 |
| Gemini AI (high usage) | $80 | $960 |
| Domain (.com) | $1.25 | $15 |
| Transactional Email | $25 | $300 |
| Error Tracking (Sentry paid) | $26 | $312 |
| **Growth Total** | **~$232** | **~$2,787** |

---

## 6. One-Time Production Readiness Costs

These are items that need to be done before going live (not covered by subscriptions):

| Item | Effort/Cost | Notes |
|---|---|---|
| Wire Supabase dashboards (Phase 3) | ~4–6 hrs dev | See IMPLEMENTATION_STATUS.md |
| Build Razorpay payment flow | ~8–12 hrs dev | Order creation + webhooks + UI |
| Email service integration (Resend) | ~2–3 hrs | Quick with Supabase native auth |
| Add Sentry error tracking | ~1 hr | One npm install + init |
| Security audit (self or peer) | ~2–4 hrs | OWASP Top 10 check on auth, RLS, CSP |
| Gemini model migration (→ 3.5 Flash or Flash-Lite) | ~1 hr | Update env + test AI endpoints |
| Rotate `ADMIN_SESSION_SECRET` | 5 min | New crypto key, update Vercel env |
| Clean up debug/test files | ~1 hr | 20+ debug/temp files in root + src |
| Performance audit (Lighthouse) | ~2 hrs | Image optimization, bundle size |
| SSL + CSP verification | 30 min | Already in next.config.ts ✓ |
| **Total one-time** | **~20–30 hrs** | |

---

## 7. Revenue Requirement to Break Even

| Scenario | Annual Cost | Monthly Revenue Needed | MAU @ $5/user/mo |
|---|---|---|---|
| Lean | $591 | $50 | 10 paying users |
| Moderate | $1,155 | $97 | 20 paying users |
| Growth | $2,787 | $233 | 47 paying users |

*Assuming you monetize via recruiter subscriptions (Pro tier: $29–49/mo seems reasonable for a job board).*

---

## 8. Recommendation: 90-Day Launch Plan

**Month 1 — Core Infrastructure ($49/mo fixed)**
- Wire remaining Supabase services (Phase 3 completion)
- Add Sentry + Resend
- Migrate Gemini model before Oct deadline
- Soft-launch with free tier or minimal pricing

**Month 2–3 — Monetization ($96/mo fixed)**
- Deploy Razorpay payment flow
- Launch Pro tier ($29–49/mo)
- Target first 10 paying recruiters to cover costs

**Month 6+ — Scale**
- Re-evaluate Supabase compute tier
- Add AI usage monitoring/capping (per-user limits)
- Move to Team plan only if compliance needed (SOC2)

---

## Appendix: Current Environment Config

```
NEXT_PUBLIC_SITE_URL=https://hirevify.com
NEXT_PUBLIC_SUPABASE_URL=https://qhbwkqeraxgdergjflrl.supabase.co
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
```
*(Secret keys omitted for this report)*
