# JobCompare — Product Roadmap & Execution Plan

> **How to read this file:** After each story is completed, the status updates here.
> Statuses: `pending` → `in progress` → `done`

---

## Sprint Execution Status

| Story | Title | Epic | Sprint | Points | Status |
|-------|-------|------|--------|--------|--------|
| JC-401 | Admin Control Centre — Shell & Navigation | Admin | 5 | 5 | `done ✓` |
| JC-402 | Scraper Control Panel | Admin | 5 | 8 | `pending` |
| JC-403 | Industry Standards Manager + Auto-Research | Admin | 5 | 13 | `pending` |
| JC-404 | Company Registry Manager (Unified) | Admin | 5 | 8 | `pending` |
| JC-405 | Data Health Dashboard | Admin | 5 | 5 | `pending` |
| JC-103 | Contextual Benchmarking on Ratings | Design | 1 | 3 | `⏸ awaiting approval` |
| JC-105 | Make Compare Feature Discoverable | Design | 1 | 2 | `⏸ on hold` |
| JC-203 | Cost of Living Static Dataset | Scraping | 1 | 2 | `⏸ on hold` |
| JC-301 | Offer Comparison Calculator ⭐ | Features | 1 | 13 | `⏸ on hold` |
| JC-101 | Landing Page Redesign | Design | 2 | 5 | `pending` |
| JC-102 | Onboarding Flow for New Users | Design | 2 | 3 | `pending` |
| JC-201 | AmbitionBox Interview Reviews Scraper | Scraping | 2 | 5 | `pending` |
| JC-302 | Salary Percentile Display | Features | 2 | 3 | `pending` |
| JC-304 | Shareable Comparison Links | Features | 2 | 5 | `pending` |
| JC-104 | Fix Dark Mode — Unify Theme | Design | 3 | 5 | `pending` |
| JC-106 | Empty States with Illustrations | Design | 3 | 2 | `pending` |
| JC-204 | Salary Data — Expand to More Companies | Scraping | 3 | 5 | `pending` |
| JC-303 | Company Watchlist | Features | 3 | 5 | `pending` |
| JC-305 | "Should I Switch?" Tool | Features | 3 | 8 | `pending` |
| JC-107 | Chart Accessibility — Pattern Fills | Design | 4 | 2 | `pending` |
| JC-108 | Review Card Summarization | Design | 4 | 3 | `pending` |
| JC-205 | Sentiment Trend Over Time | Scraping | 4 | 5 | `pending` |
| JC-206 | "Request a Company" Feature | Scraping | 4 | 3 | `pending` |
| JC-306 | Attrition Risk Score (Recruiter) | Features | 4 | 5 | `pending` |
| JC-307 | PDF Export of Comparison | Features | 4 | 5 | `pending` |
| JC-308 | "People Like You" Decision Stories | Features | 4 | 8 | `pending` |
| JC-202 | MCA Portal Company Data Integration | Scraping | 4 | 8 | `pending` |

---

## Sprint Plan

| Sprint | Stories | Focus | Total Points |
|--------|---------|-------|-------------|
| Sprint 1 | JC-103, JC-105, JC-203, JC-301 | Core differentiators | 20 | ⏸ ON HOLD |
| Sprint 2 | JC-101, JC-102, JC-201, JC-302, JC-304 | Landing + data + sharing | 21 | ⏸ ON HOLD |
| Sprint 3 | JC-104, JC-106, JC-204, JC-303, JC-305 | Polish + expansion + switch tool | 25 | ⏸ ON HOLD |
| Sprint 4 | JC-107, JC-108, JC-205, JC-206, JC-306, JC-307, JC-308, JC-202 | Accessibility + recruiter + export | 39 | ⏸ ON HOLD |
| **Sprint 5** | **JC-401, JC-402, JC-403, JC-404, JC-405** | **Unified Admin Control Centre** | **39** | **▶ ACTIVE** |

---

## EPIC 4 — Unified Admin Control Centre

> Single admin surface to control scraping, company data, industry standards, and system health.
> Replaces the existing basic `/admin/registry` page with a full-featured control centre.

---

### JC-401 | Admin Control Centre — Shell & Navigation
**Priority:** Critical | **Points:** 5 | **Status:** `pending`

**As an** admin,
**I want** a dedicated, well-structured admin area with clear navigation,
**So that** I can manage all platform data from one place without touching code.

**Acceptance Criteria:**
- [ ] New layout at `/admin` with sidebar navigation (replaces current bare `/admin/registry`)
- [ ] Sidebar sections: Overview, Companies, Scraper, Industry Standards, Data Health
- [ ] Protected route — only accessible when `ADMIN_SECRET` header or session flag present
- [ ] Breadcrumb navigation per section
- [ ] Consistent card-based editorial design matching the platform

**Files to change:**
- `frontend/src/app/admin/layout.tsx` (new — admin shell)
- `frontend/src/app/admin/page.tsx` (redirect to overview)
- `frontend/src/components/layout/admin-sidebar.tsx` (new)

---

### JC-402 | Scraper Control Panel
**Priority:** High | **Points:** 8 | **Status:** `pending`

**As an** admin,
**I want** to trigger and monitor scraper runs from the UI,
**So that** I don't need terminal access to refresh data.

**Acceptance Criteria:**
- [ ] "Run All" button — triggers batch scrape for all companies in registry
- [ ] "Run Single" — per-company trigger with live status indicator
- [ ] "Run Failed" — retries companies with last failed scrape
- [ ] Live status feed — shows current scrape progress (polling `/api/scraper-status` every 5s)
- [ ] Per-company status table: last scraped, result (success/fail/pending), review count, salary count
- [ ] "Schedule" display — shows next scheduled GitHub Actions run (from cron config)
- [ ] Error log per company — expandable row showing failure reason

**Files to change:**
- `frontend/src/app/admin/scraper/page.tsx` (new)
- `frontend/src/app/api/admin/scraper/trigger/route.ts` (new)
- `frontend/src/app/api/admin/scraper/status/route.ts` (new)

---

### JC-403 | Industry Standards Manager + Auto-Research
**Priority:** Critical | **Points:** 13 | **Status:** `pending`

**As an** admin,
**I want** to view and edit industry standards from the UI, with automated research for new industries,
**So that** benchmarking stays accurate without code changes when new companies or industries are added.

**Core Workflow:**
```
New company added → Industry detected → 
  Is industry in DB standards? 
    YES → benchmarks work immediately
    NO  → Flag as "Unmapped" → Admin notified →
          Admin clicks "Research" →
          Web search runs (Glassdoor + AmbitionBox data) →
          Suggested standard returned with citation →
          Admin reviews → Approves/Edits → Saved to DB →
          All companies in that industry now benchmarked correctly
```

**Acceptance Criteria:**
- [ ] New Prisma model `IndustryStandard`: `industry` (unique), `standard` (float), `source`, `citation`, `notes`, `year`, `isResearched` (bool), `createdAt`, `updatedAt`
- [ ] Migration: seed table from current `industry-standards-source.ts` values (25 industries)
- [ ] Admin table: all industries in use, with mapped/unmapped status, current standard, source, last updated
- [ ] "Unmapped" badge for industries with no specific standard (using default 3.5)
- [ ] Alert banner: "X industries are unmapped — click to research"
- [ ] "Research" button per unmapped industry → triggers `POST /api/admin/industry-standards/research`
  - Server calls web search (Glassdoor + AmbitionBox queries for that industry)
  - Returns: suggested standard (float), source name, citation URL, notes
  - UI shows suggestion card: "Suggested: 3.7 — Source: Glassdoor 2026"
- [ ] Admin can edit suggested value before saving
- [ ] "Approve" saves to DB; benchmarks update instantly (no deploy)
- [ ] Edit button on any existing standard — change value + update citation
- [ ] `getIndustryStandard()` reads from DB (not hardcoded file) — fallback to 3.5 if not found
- [ ] New industry auto-detected when `/api/sync` receives a company with unknown industry

**Files to change:**
- `frontend/prisma/schema.prisma` (new `IndustryStandard` model)
- `frontend/src/app/admin/industry-standards/page.tsx` (new)
- `frontend/src/app/api/admin/industry-standards/route.ts` (new — CRUD)
- `frontend/src/app/api/admin/industry-standards/research/route.ts` (new — web research)
- `frontend/src/lib/industry-standards-source.ts` (converted to seed script only)
- `frontend/src/app/api/industry-averages/route.ts` (reads from DB instead of file)
- `frontend/src/app/api/sync/route.ts` (detect + flag unmapped industries)

---

### JC-404 | Company Registry Manager (Unified)
**Priority:** High | **Points:** 8 | **Status:** `pending`

**As an** admin,
**I want** a unified company management view showing all companies, their data health, and industry mapping,
**So that** I can manage the registry without editing JSON files.

**Acceptance Criteria:**
- [ ] Full company table: name, slug, industry, overall rating, reviews count, salaries count, benefits count, last scraped, scrape status
- [ ] Inline industry editor — change a company's industry from the table
- [ ] "Add Company" form: name, AmbitionBox slug (auto-suggested), industry (dropdown from existing industries)
  - On add: check if industry has a standard → if not, show inline "Research needed" prompt
- [ ] "Remove Company" with confirmation modal
- [ ] Filter by industry, scrape status (success/fail/never)
- [ ] Sort by name, last scraped, rating, review count
- [ ] Bulk action: "Re-scrape selected"
- [ ] Replace current `/admin/registry` page

**Files to change:**
- `frontend/src/app/admin/companies/page.tsx` (new — replaces `/admin/registry`)
- `frontend/src/app/api/admin/companies/route.ts` (new — CRUD)

---

### JC-405 | Data Health Dashboard
**Priority:** Medium | **Points:** 5 | **Status:** `pending`

**As an** admin,
**I want** a system health overview showing data freshness, coverage gaps, and anomalies,
**So that** I can proactively identify and fix data quality issues.

**Acceptance Criteria:**
- [ ] Summary stats: total companies, total reviews, total salaries, total benefits, last full scrape time
- [ ] "Stale companies" list — companies not scraped in >7 days (highlighted in amber)
- [ ] "No salary data" list — companies with 0 salary records
- [ ] "No reviews" list — companies with 0 reviews
- [ ] "Unmapped industries" count with link to Industry Standards page
- [ ] Per-industry coverage table: company count, avg reviews per company, avg salaries per company
- [ ] Quick-action buttons: "Scrape stale companies", "View unmapped industries"

**Files to change:**
- `frontend/src/app/admin/page.tsx` (overview dashboard)
- `frontend/src/app/api/admin/health/route.ts` (new — aggregated health stats)

---

## EPIC 1 — Design & UX Polish

### JC-101 | Landing Page Redesign
**Priority:** High | **Points:** 5 | **Status:** `pending`

**As a** first-time visitor,
**I want** to immediately understand what JobCompare does and see proof it works,
**So that** I'm compelled to try it instead of going back to AmbitionBox.

**Acceptance Criteria:**
- [ ] Replace "India's #1 Platform" with specific, honest value prop
- [ ] Add product screenshot / animated demo of comparison view above the fold
- [ ] Add social proof strip: comparisons run, reviews submitted, salary data points
- [ ] Add 3 short testimonial cards
- [ ] Replace ticker bar with something substantive
- [ ] Add "How it works" section: 3 steps with icons

**Files to change:**
- `frontend/src/app/page.tsx`

---

### JC-102 | Onboarding Flow for New Users
**Priority:** High | **Points:** 3 | **Status:** `pending`

**As a** first-time user who lands on the dashboard,
**I want** a brief guided tour of what each section means,
**So that** I don't bounce because I don't understand what I'm looking at.

**Acceptance Criteria:**
- [ ] On first visit (localStorage flag), show 3-step tooltip tour: Search → View Data → Compare
- [ ] Each tooltip has Next / Skip button
- [ ] Tour highlights: search bar, "+ Compare" button, ratings gauge, review filters
- [ ] Tour state saved in localStorage so it doesn't repeat

**Files to change:**
- `frontend/src/components/onboarding-tour.tsx` (new)
- `frontend/src/app/job-seeker/[slug]/page.tsx`

---

### JC-103 | Contextual Benchmarking on Ratings
**Priority:** High | **Points:** 3 | **Status:** `done ✓`

**As a** job seeker viewing a company rating,
**I want** to know if 3.5 is good or bad for that industry,
**So that** raw numbers have meaning.

**Acceptance Criteria:**
- [ ] Below each rating display: "Above industry average (IT Services avg: 3.2)"
- [ ] Industry averages computed from existing DB data grouped by `industry` field
- [ ] New API endpoint `GET /api/industry-averages`
- [ ] Color-coded: green if above avg, amber if within 0.2, red if below avg

**Files to change:**
- `frontend/src/app/api/industry-averages/route.ts` (new)
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/components/charts/rating-gauge.tsx`

---

### JC-104 | Fix Dark Mode — Unify Theme
**Priority:** Medium | **Points:** 5 | **Status:** `pending`

**As a** user navigating between pages,
**I want** a consistent visual experience,
**So that** I don't get jarred switching between a dark auth page and a cream dashboard.

**Acceptance Criteria:**
- [ ] Audit all pages for theme consistency
- [ ] Make auth pages match dashboard cream theme
- [ ] Dark mode toggle (if implemented) persists via localStorage

**Files to change:**
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/globals.css`

---

### JC-105 | Make Compare Feature Discoverable
**Priority:** High | **Points:** 2 | **Status:** `pending`

**As a** job seeker viewing a company page,
**I want** to clearly see how to add a company to compare,
**So that** I don't miss the core feature of the product.

**Acceptance Criteria:**
- [ ] Add prominent "Compare this company" button in company detail hero section
- [ ] Tooltip on first visit: "Add up to 3 companies and compare them side by side"
- [ ] Compare bar shows company count badge when ≥1 company selected
- [ ] When 0 companies selected, compare bar shows "Start comparing — add a company"

**Files to change:**
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/components/compare-bar.tsx`

---

### JC-106 | Empty States with Illustrations
**Priority:** Low | **Points:** 2 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Compare page empty state: illustration + "Search a company to start comparing" CTA
- [ ] Search "no results": "Can't find your company? Request it →" link
- [ ] Review tab empty state: "Be the first to review this company"
- [ ] Salary tab empty state: "No salary data yet — submit yours"

**Files to change:**
- `frontend/src/app/job-seeker/compare/page.tsx`
- `frontend/src/components/search-bar.tsx`
- `frontend/src/app/job-seeker/[slug]/page.tsx`

---

### JC-107 | Chart Accessibility — Pattern Fills
**Priority:** Medium | **Points:** 2 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Add pattern fills / shape markers to all Recharts charts as secondary differentiator
- [ ] Verify legend text labels render correctly at small sizes
- [ ] Add `aria-label` to all chart wrapper divs

**Files to change:**
- `frontend/src/app/job-seeker/compare/page.tsx`
- `frontend/src/app/recruiter/[slug]/page.tsx`

---

### JC-108 | Review Card Summarization
**Priority:** Medium | **Points:** 3 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Add "Summary" card above review list using `SentimentSnapshot.topPositiveThemes`
- [ ] Top 3 positive + top 3 negative themes as pill badges with mention counts
- [ ] Only shown when ≥10 reviews exist

**Files to change:**
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/components/review-summary.tsx` (new)

---

## EPIC 2 — Data & Scraping Expansion

### JC-201 | AmbitionBox Interview Reviews Scraper
**Priority:** High | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Extend `ambitionbox.py` to scrape `/interviews` page per company
- [ ] Extract: difficulty rating, experience type, role, process steps
- [ ] New Prisma model `Interview`: `companyId`, `role`, `difficulty`, `experience`, `process`, `reviewDate`
- [ ] Expose under `interviews` key in `GET /api/company/[slug]`
- [ ] Display on job seeker dashboard: avg difficulty gauge + process steps list

**Files to change:**
- `scraper/scrapers/ambitionbox.py`
- `frontend/prisma/schema.prisma`
- `frontend/src/app/api/company/[slug]/route.ts`
- `frontend/src/app/job-seeker/[slug]/page.tsx`

---

### JC-202 | MCA Portal Company Data Integration
**Priority:** Medium | **Points:** 8 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Scraper hits `mca.gov.in` for each company
- [ ] Extracts: capital, employee count, incorporation date, company status
- [ ] Stored in extended `Company` model or new `CompanyMeta` table
- [ ] Shown on recruiter dashboard under "Company Health"
- [ ] Runs weekly (not daily)

**Files to change:**
- `scraper/scrapers/mca.py` (new)
- `frontend/prisma/schema.prisma`
- `frontend/src/app/recruiter/[slug]/page.tsx`

---

### JC-203 | Cost of Living Static Dataset
**Priority:** High | **Points:** 2 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Create `scraper/data/cost_of_living.json` with COL index for 9 Indian cities
- [ ] Bangalore = 100 baseline (Numbeo + NoBroker derived)
- [ ] Cities: Bangalore, Mumbai, Delhi/NCR, Hyderabad, Pune, Chennai, Kolkata, Ahmedabad, Remote
- [ ] Used by Offer Comparison Calculator (JC-301)

**Files to change:**
- `scraper/data/cost_of_living.json` (new)
- `frontend/src/lib/col-data.ts` (new — re-exports as typed constant)

---

### JC-204 | Salary Data — Expand to More Companies
**Priority:** High | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Expand registry from 50 → 150 companies
- [ ] Add startups: Meesho, Groww, Zepto, Blinkit, Ola, Uber India, Freshworks, Zoho, upGrad, BYJU's
- [ ] Add PSUs: BHEL, ONGC, SAIL, Coal India, NTPC
- [ ] Add consulting: Deloitte, EY, PwC, KPMG, McKinsey India, BCG India
- [ ] Verify each exists on AmbitionBox before adding

**Files to change:**
- `scraper/data/company_registry.json`

---

### JC-205 | Sentiment Trend Over Time
**Priority:** Medium | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Add `period` field to `SentimentSnapshot` (e.g. `2026-03`)
- [ ] Pipeline creates new monthly snapshot instead of overwriting
- [ ] API returns last 6 months of snapshots per company
- [ ] Recruiter dashboard: line chart of Positive % over 6 months
- [ ] Migration to backfill existing snapshots with current month

**Files to change:**
- `frontend/prisma/schema.prisma`
- `scraper/pipeline.py`
- `frontend/src/app/api/company/[slug]/route.ts`
- `frontend/src/app/recruiter/[slug]/page.tsx`

---

### JC-206 | "Request a Company" Feature
**Priority:** Medium | **Points:** 3 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Search "no results" shows "Request [company name] →" button
- [ ] Form: company name, AmbitionBox URL (optional), email
- [ ] `CompanyRequest` Prisma model with vote count
- [ ] `/admin/registry` shows requests sorted by votes
- [ ] Auto-flag if 3+ requests for same company

**Files to change:**
- `frontend/prisma/schema.prisma`
- `frontend/src/app/api/company-requests/route.ts` (new)
- `frontend/src/components/search-bar.tsx`
- `frontend/src/app/admin/registry/page.tsx`

---

## EPIC 3 — New Features / Product Differentiation

### JC-301 | Offer Comparison Calculator ⭐
**Priority:** Critical | **Points:** 13 | **Status:** `pending`

**As a** job seeker with two real offers,
**I want** to input my actual offer details and get a data-driven comparison,
**So that** I can make my decision with confidence.

**Acceptance Criteria:**
- [ ] New route `/compare/offers`
- [ ] Step 1: Offer A — Company (autocomplete), Role, Base Salary, Annual Bonus, Joining Bonus, WFH days/week, City
- [ ] Step 2: Offer B — same fields
- [ ] Step 3: Results showing:
  - Total annual compensation (base + bonus) for each
  - COL-adjusted "effective salary" using JC-203 dataset
  - Market percentile: "Your Offer A base of 18L is at the 62nd percentile for this role"
  - Company reputation overlay (ratings from DB)
  - Benefits comparison
  - Sentiment score per company
- [ ] "Your priority" weights: Salary / WLB / Growth → personalized recommendation score
- [ ] Shareable URL (30-day TTL, stored in DB)
- [ ] No auth required

**Files to change:**
- `frontend/src/app/compare/offers/page.tsx` (new)
- `frontend/src/app/api/offer-comparison/route.ts` (new)
- `frontend/prisma/schema.prisma` (OfferComparison snapshot model)
- `frontend/src/lib/col-data.ts` (from JC-203)

---

### JC-302 | Salary Percentile Display
**Priority:** High | **Points:** 3 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] P25 / P50 / P75 computed per role from existing salary data in DB
- [ ] Visual horizontal bar showing P25–P75 range with avg marker
- [ ] Tooltip: "25th percentile: 14L, Median: 18L, 75th: 24L"

**Files to change:**
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/components/charts/salary-chart.tsx`

---

### JC-303 | Company Watchlist
**Priority:** Medium | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Bookmark icon on company detail pages
- [ ] `Watchlist` Prisma model: `userId`, `companyId`, `createdAt`
- [ ] `/job-seeker` dashboard shows "Your Watchlist" section when logged in
- [ ] Max 20 bookmarks per user
- [ ] API: `POST /api/watchlist`, `DELETE /api/watchlist/[slug]`, `GET /api/watchlist`

**Files to change:**
- `frontend/prisma/schema.prisma`
- `frontend/src/app/api/watchlist/route.ts` (new)
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/app/job-seeker/page.tsx`

---

### JC-304 | Shareable Comparison Links
**Priority:** High | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] "Share" button on `/job-seeker/compare`
- [ ] Generates unique URL: `/compare/[uuid]`, 30-day TTL
- [ ] `ComparisonSnapshot` Prisma model: company slugs + timestamp
- [ ] "Copy link" + "Share on WhatsApp" + "Share on LinkedIn" buttons
- [ ] Expired links show graceful "This comparison has expired" page

**Files to change:**
- `frontend/prisma/schema.prisma`
- `frontend/src/app/api/comparison-snapshot/route.ts` (new)
- `frontend/src/app/compare/[uuid]/page.tsx` (new)
- `frontend/src/app/job-seeker/compare/page.tsx`

---

### JC-305 | "Should I Switch?" Tool
**Priority:** Medium | **Points:** 8 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] New route `/should-i-switch`
- [ ] Step 1: Current job — Company, Role, Salary, Years there, City
- [ ] Step 2: New offer — Company, Role, Salary, City
- [ ] Output: financial delta (COL-adjusted), career growth comparison, stability score, culture comparison, summary recommendation
- [ ] Shareable result, no auth required

**Files to change:**
- `frontend/src/app/should-i-switch/page.tsx` (new)
- `frontend/src/app/api/switch-analysis/route.ts` (new)

---

### JC-306 | Attrition Risk Score (Recruiter)
**Priority:** Medium | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] Compute `attritionRisk` score (0–100) from: job security rating, layoff keyword frequency, negative theme %, rating trend
- [ ] Shown as gauge on recruiter dashboard: Low / Medium / High
- [ ] Competitor panel shows attrition risk side by side
- [ ] Tooltip explains how score is calculated

**Files to change:**
- `frontend/src/app/api/company/[slug]/route.ts`
- `frontend/src/app/recruiter/[slug]/page.tsx`

---

### JC-307 | PDF Export of Comparison
**Priority:** Low | **Points:** 5 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] "Export PDF" button on `/job-seeker/compare`
- [ ] PDF includes: company summary cards, ratings table, salary comparison, benefits grid
- [ ] Uses `html2canvas` + `jspdf` (client-side, no server)
- [ ] Branded with JobCompare logo + generation date

**Files to change:**
- `frontend/src/app/job-seeker/compare/page.tsx`
- `frontend/package.json` (add html2canvas + jspdf)

---

### JC-308 | "People Like You" Decision Stories
**Priority:** Low | **Points:** 8 | **Status:** `pending`

**Acceptance Criteria:**
- [ ] "Decision Stories" section on company detail page
- [ ] Auth required to submit, anonymous to read
- [ ] Form: "I was choosing between X and Y. I chose X because..." (500 chars)
- [ ] `DecisionStory` Prisma model with upvote system
- [ ] Shown on both companies' pages

**Files to change:**
- `frontend/prisma/schema.prisma`
- `frontend/src/app/api/decision-stories/route.ts` (new)
- `frontend/src/app/job-seeker/[slug]/page.tsx`
- `frontend/src/components/decision-story-form.tsx` (new)
