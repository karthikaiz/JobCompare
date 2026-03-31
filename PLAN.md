# JobCompare - Implementation Plan (User Stories)

## Context

Job comparison platform with two dashboards (Job Seeker + Recruiter) that aggregates company data from AmbitionBox, Glassdoor (mocked), and user-submitted reviews. India-focused, starting with 50 companies scaling to 500+.

**Tech Stack**: Next.js 14 + Python FastAPI + SQLite/Prisma + shadcn/ui + Recharts/Tremor + NextAuth.js

**Architecture**:
```
Browser → Next.js (frontend/ port 3000) → Python FastAPI (scraper/ port 8000)
                    ↓
              SQLite via Prisma (cache + user data)
```

---

## Story 1: Project Scaffolding & Seed Data ✅ DONE
**As a developer, I want the project initialized with both services running.**

- [x] Next.js 14 with TypeScript, Tailwind, shadcn/ui
- [x] Prisma with SQLite + full data model (8 tables)
- [x] Python FastAPI with dependencies
- [x] Seed data for 12 Indian companies
- [x] Pydantic schemas mirroring Prisma models

---

## Story 2: AmbitionBox Scraper ✅ DONE
**As a developer, I want a working scraping API to fetch real company data.**

- [x] BaseScraper with rate limiting (3-5s delay, browser-like headers)
- [x] AmbitionBox scraper: overview, reviews, salaries, benefits
- [x] Glassdoor mock endpoint returning seed data
- [x] Sentiment analysis endpoint (VADER)
- [x] Tested: Infosys (5 reviews, 8 salaries, 24 benefits), TCS (30 reviews, 8 salaries, 24 benefits)

---

## Story 2A: Company Registry & Batch Scraper
**As a developer, I want to scrape 50 companies in batch so I have a large dataset.**

Tasks:
- `scraper/data/company_registry.json` — Master list of 50 Indian companies with AmbitionBox slugs (IT, fintech, e-commerce, banking, pharma, auto, FMCG, telecom)
- `scraper/batch.py` — Batch scraping engine that processes the full registry
- Stores results in `scraper/data/scraped/` as individual JSON files per company
- Progress tracking: which companies succeeded/failed, retry logic for failures
- Respects rate limits (~5s between requests, ~45-60 min for full 50-company run)
- CLI with options: `--company infosys` (single), `--all` (full batch), `--failed` (retry failures)

**Test**:
- `python batch.py --company infosys` → Scrapes Infosys, saves JSON
- `python batch.py --all` → Scrapes all 50 companies, prints summary (X succeeded, Y failed)
- Check `scraper/data/scraped/infosys.json` has overview + reviews + salaries + benefits

---

## Story 2B: Data Formatting & DB Sync Pipeline
**As a developer, I want scraped data automatically formatted, sentiment-analyzed, and synced to the database.**

Tasks:
- `scraper/pipeline.py` — Reads scraped JSON files → runs VADER sentiment on all reviews → syncs to SQLite
- Next.js API route `POST /api/sync` — Accepts formatted company data, upserts Company + Reviews + Salaries + Benefits + SentimentSnapshot
- Sentiment enrichment: auto-classify every review as positive/negative/neutral with score
- Theme extraction: identify top positive/negative themes per company from review text
- Deduplication: skip reviews already in DB (match by title + role + date hash)
- Update company ratings and sentiment snapshots when data changes

**Test**:
- Run `python pipeline.py` → All scraped companies synced to DB
- Query DB → Each company has sentiment scores on every review
- Run pipeline again → No duplicates created
- Check SentimentSnapshot → Each company has top themes

---

## Story 2C: Automated Daily Scraper (GitHub Actions)
**As a developer, I want the scraper to run automatically once daily — even when my Mac is off.**

Uses GitHub Actions (free for public repos, 2000 min/month for private). Scraper runs in a container, saves scraped JSON data, and commits it to the repo.

Tasks:
- `.github/workflows/daily-scrape.yml` — GitHub Actions workflow
  - Cron schedule: `0 20 * * *` (2 AM IST = 8:30 PM UTC, rounded to 8 PM UTC)
  - Sets up Python, installs scraper dependencies
  - Runs `python batch.py --all` to scrape all registered companies
  - Runs `python pipeline.py` to format data + run sentiment analysis
  - Commits updated JSON files to repo (`scraper/data/scraped/`)
  - Also supports manual trigger via `workflow_dispatch` button in GitHub UI
- `scraper/scheduler.py` — Orchestrates batch scrape + pipeline in one command (used by both GH Actions and local runs)
- Logging: each run produces a summary in the Actions log (X succeeded, Y failed, Z new reviews)
- Stale data detection: flag companies not updated in 48+ hours
- Graceful error handling: one company failing doesn't stop the rest
- Artifact upload: save full log as downloadable artifact on each run

**Test**:
- Run `python scheduler.py` locally → Full scrape + sync completes
- Push workflow to GitHub → Manually trigger via Actions tab → Verify it runs and commits scraped data
- Check Actions log → Shows per-company status and summary
- Wait for scheduled run (next day) → Verify it ran automatically

---

## Story 2D: Company Registry Management
**As a user, I want to easily add new companies to the scraping list.**

Tasks:
- API endpoint `GET /api/registry` — List all registered companies + last scraped time + status
- API endpoint `POST /api/registry` — Add a new company by name (auto-discovers AmbitionBox slug)
- Auto-discovery: search AmbitionBox for company name → find correct slug
- API endpoint `DELETE /api/registry/{slug}` — Remove a company from scraping
- Validation: verify company exists on AmbitionBox before adding
- Simple admin page at `/admin/registry` to manage the company list

**Test**:
- `POST /api/registry {"name": "PhonePe"}` → Auto-discovers slug, adds to registry
- `GET /api/registry` → Shows all 50+ companies with last scraped timestamps
- Next scrape cycle picks up the new company automatically

---

## Story 3: Next.js API Layer (BFF + Caching)
**As a frontend, I want API routes that serve company data from the database.**

Tasks:
- `GET /api/companies?q=...` → Search companies in DB
- `GET /api/company/[slug]` → Full company detail (ratings, reviews, salaries, benefits, sentiment)
- `POST /api/refresh/[slug]` → Trigger fresh scrape for a single company
- Caching logic: serve from SQLite (data kept fresh by daily scraper)
- `scraper-client.ts` → Typed HTTP client for Python service

**Test**:
- Search "Infosys" → Returns company data from DB
- Call refresh → Scraper triggered, new data stored
- Second call returns cached data instantly

---

## Story 4: Landing Page + Layout Shell
**As a user, I want a landing page where I choose my role and a consistent dashboard layout.**

Tasks:
- Landing page (`/`) with split CTA: "I'm a Job Seeker" / "I'm a Recruiter"
- Search bar front and center
- `DashboardShell` layout: sidebar nav, top bar with role switcher
- `Navbar`, `Sidebar` components
- Responsive design (works on tablet+)

**Test**:
- Visit `/` → See landing page with role selection
- Click "Job Seeker" → Navigate to `/job-seeker` with dashboard layout
- Click "Recruiter" → Navigate to `/recruiter` with dashboard layout

---

## Story 5: Job Seeker Dashboard
**As a job seeker, I want to search a company and see ratings, salary, benefits, and reviews.**

Tasks:
- `SearchBar` with debounced autocomplete from `/api/companies`
- Company detail page (`/job-seeker/[company]`) with:
  - `RatingGauge` - circular gauge (0-5 scale)
  - `BenefitsRadar` - radar chart (5 axes: WLB, Salary, Security, Growth, Culture)
  - `SalaryRangeChart` - horizontal bar chart (min/avg/max per role)
  - `BenefitsBadges` - colored pills grouped by category
  - `ReviewCard` list - sentiment-colored left border, star display
- Loading skeletons while data loads

**Test**:
- Search "Infosys" → Autocomplete shows suggestion
- Click → See company detail with all visualizations
- Radar chart shows 5 rating axes
- Salary chart shows real salary ranges
- Reviews display with sentiment colors

---

## Story 6: Company Comparison (Job Seeker)
**As a job seeker, I want to compare 2-3 companies side by side.**

Tasks:
- "Add to Compare" button on company cards
- Comparison page with grouped bar chart
- Side-by-side ratings, salary ranges, benefits

**Test**:
- Add Infosys + TCS to compare → See grouped bar chart

---

## Story 7: Recruiter Dashboard
**As a recruiter, I want to see sentiment analysis, why people leave, and competitive intel.**

Tasks:
- Recruiter company detail (`/recruiter/[company]`) with:
  - Sentiment donut chart (positive/negative/neutral)
  - "Why People Leave" - bar chart of top negative themes
  - "What People Like" - bar chart of top positive themes
  - Filterable review list (by sentiment, role, current/former)
  - Competitor comparison panel

**Test**:
- Navigate to `/recruiter/infosys` → See sentiment analysis
- "Why People Leave" shows real themes from scraped reviews
- Filter reviews by "Negative" → Only negative reviews shown

---

## Story 8: User Reviews & Community Features ✅ DONE
**As a job seeker, I want to submit my own review and salary data.**

- [x] JWT auth system (jose + bcryptjs) — register, login, logout, /api/auth/me
- [x] AuthProvider context for client-side auth state
- [x] Login & Register pages at /login and /register
- [x] Navbar shows Sign In / user name + Logout across all pages
- [x] Multi-step ReviewForm (3 steps: About You → Ratings → Pros/Cons)
- [x] POST /api/reviews with validation, rate limiting (1/company/24h), string truncation
- [x] SalarySubmitForm with experience range picker
- [x] POST /api/salaries with validation, rate limiting (1/company/week)
- [x] Community reviews merged with scraped reviews in company detail
- [x] "Community" badge on user-submitted reviews
- [x] Upvote system (POST /api/reviews/upvote) with upvote button UI
- [x] Source filter: All Sources / Data / Community
- [x] Company detail API updated to include userReviews and userSalaries

**Test**:
- Register → Login → Submit review → Appears with "Community" badge
- Upvote a review → Count increments
- Filter by source → Only matching reviews shown

---

## Story 8B: Firebase Google Sign-In ✅ DONE
**As a user, I want to sign in with my Google account for a faster, passwordless login.**

- [x] Firebase project created (jobcompare-f5b98), Google sign-in enabled
- [x] Firebase config stored in `.env`
- [x] `firebase` SDK installed, `src/lib/firebase.ts` with app init + Google provider
- [x] "Continue with Google" button on `/login` and `/register` pages (with Google logo SVG)
- [x] `POST /api/auth/firebase` — Verifies Firebase ID token via Google public keys + jose, auto-creates User in DB, issues JWT session cookie
- [x] AuthProvider updated with `loginWithGoogle()` method
- [x] Email linking: if Google email matches existing email/password user, same account is used
- [x] Firebase sign-out on logout

**Test**:
- Click "Continue with Google" → Google popup → Redirected to /job-seeker as logged-in user
- First-time Google user → User auto-created in DB
- Existing email/password user signs in with same email via Google → Accounts linked
- Submit review after Google sign-in → Works with Community badge

---

## Story 9: Polish & Dark Mode
**As a user, I want a polished experience with dark mode and proper error handling.**

Tasks:
- Dark mode toggle
- Loading skeletons for every section
- Error states when scraping fails
- Empty states when no data found
- Responsive layout fine-tuning

---

## Future Stories (Phase 2+)
- **Story 10**: Add Payscale India scraper (salary data)
- **Story 11**: Add Glassdoor scraper (reviews, salaries, ratings — requires handling Cloudflare + login walls)
- **Story 11B**: Add Levels.fyi scraper (tech compensation)
- **Story 12**: Add MCA Portal integration (official company data)
- **Story 13**: Add Indeed India scraper
- **Story 14**: Email verification for company domain matching
- **Story 15**: Admin moderation dashboard for user reviews

---

## Quality Gate (applies to every story)
Every story that produces UI or API changes MUST pass this checklist before moving on:
- **TypeScript**: `npx tsc --noEmit` passes with zero errors
- **API edge cases**: Invalid inputs, empty strings, negative numbers, missing fields all return proper errors (not crashes)
- **Null/falsy safety**: All conditional renders use `!= null` checks, never truthiness (avoids 0/empty-string bugs)
- **Responsive layout**: All grids use mobile-first breakpoints (`grid-cols-1 sm:grid-cols-N`), flex containers use `flex-wrap` where overflow is possible
- **Loading/error/empty states**: Every data-fetching page handles loading skeleton, error message, and empty data gracefully
- **Security**: No internal details leaked in error messages, all user inputs validated, string fields truncated before DB writes
- **Float precision**: Rating values rounded to 2 decimal places before sending to frontend

---

## Key Libraries
- **Frontend**: next, react, tailwindcss, shadcn/ui, recharts, next-auth
- **Scraper**: fastapi, uvicorn, httpx, beautifulsoup4, vaderSentiment, pydantic, schedule
- **Database**: prisma, @prisma/client

## Data Refresh Schedule
```
Daily (2 AM):     Full batch scrape of all registered companies
Real-time:        User-submitted reviews and ratings
On-demand:        Manual refresh via API for individual companies
```

## Companies Coverage (Phase 1 - 50 companies)
IT Services: Infosys, TCS, Wipro, HCL, Tech Mahindra, Cognizant, LTIMindtree, Mphasis
Fintech: Razorpay, Paytm, PhonePe, CRED, BharatPe, PolicyBazaar
E-commerce: Flipkart, Amazon India, Myntra, Meesho, Nykaa
Food/Delivery: Zomato, Swiggy
Banking: HDFC Bank, ICICI Bank, Kotak Mahindra, Axis Bank, SBI
Conglomerate: Reliance, Tata Group, Adani Group, Mahindra
SaaS: Zoho, Freshworks, Postman, BrowserStack, Chargebee
Auto: Ola, Uber India, Maruti Suzuki, Tata Motors
Pharma: Sun Pharma, Dr. Reddy's, Cipla
Telecom: Jio, Airtel
Others: Byju's, Unacademy, Dream11, Zerodha, Groww
