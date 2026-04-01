# Webhook-Based Scraper Setup (GitHub Actions → Render)

The scraper now runs on **Render** instead of GitHub Actions to avoid IP blocking issues.

## What Changed

- ❌ GitHub Actions no longer runs the scraper directly
- ✅ GitHub Actions calls a **webhook** on Render to trigger the scraper
- ✅ Render scraper runs daily via GitHub Actions webhook (free)
- ✅ Data syncs to your Neon PostgreSQL database

---

## Setup Steps

### Step 1: Generate Webhook Token

```bash
openssl rand -hex 32
```

Copy the output. You'll use this token in the next steps.

---

### Step 2: Add Token to GitHub Actions Secrets

1. Go to **GitHub** → Your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add:
   - **Name**: `SCRAPE_WEBHOOK_TOKEN`
   - **Value**: The token you generated in Step 1

---

### Step 3: Add Token to Render Environment

1. Go to **Render Dashboard** → Your **jobcompare-scraper** web service
2. Click **"Environment"** tab
3. Add new environment variable:
   - **Key**: `SCRAPE_WEBHOOK_TOKEN`
   - **Value**: The **same** token from Step 1
4. Click **"Save"**

This will **automatically redeploy** the scraper with the new env var.

---

### Step 4: Verify Deployment

After Render redeploys:

1. Go to **Render Dashboard** → **jobcompare-scraper** → **Logs**
2. Should show: `✓ Your service is live`
3. Test the webhook manually:

```bash
curl -X POST https://jobcompare-scraper.onrender.com/trigger-scrape \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

Should return: `{"status":"success","message":"Scrape and pipeline completed successfully"}`

---

### Step 5: Test GitHub Actions

1. Go to **GitHub** → Your repo → **Actions** → **Daily Scraper**
2. Click **"Run workflow"** → **Run workflow**
3. Wait ~2-3 minutes
4. Check **Render** logs to see scraper running:
   - `🚀 Starting batch scrape...`
   - `✓ Batch scrape completed`
   - `📊 Starting data pipeline...`
   - `✓ Pipeline completed`

---

## How It Works

```
GitHub Actions (weekly)
    ↓
    ↓ (calls webhook)
    ↓
Render Web Service (jobcompare-scraper)
    ↓
    ├→ batch.py (scrapes all 52 companies)
    ├→ pipeline.py (adds sentiment, syncs to DB)
    ↓
Neon PostgreSQL (job-compare-omega.vercel.app)
```

**Benefits:**
- ✅ Render IP isn't blocked by AmbitionBox
- ✅ Free (no cron job charges)
- ✅ Data syncs to production instantly
- ✅ GitHub Actions just triggers, doesn't run Python

---

## Troubleshooting

**Q: Webhook returns 401 Unauthorized**
- A: Token mismatch. Make sure both GitHub secret and Render env var have the exact same value

**Q: Scraper still getting blocked**
- A: Render might be using a datacenter IP. Try manually running locally:
  ```bash
  cd scraper
  python3 batch.py --all
  python3 pipeline.py
  ```

**Q: No data appearing in production**
- A: Check `NEXTJS_SYNC_URL` and `SYNC_API_KEY` are set in Render env
- Also check `DATABASE_URL` is correct Neon connection string

---

## Manual Trigger (if needed)

To manually trigger the scraper without waiting for GitHub Actions:

```bash
curl -X POST https://jobcompare-scraper.onrender.com/trigger-scrape \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_SCRAPE_WEBHOOK_TOKEN"}'
```

Or via **Render Dashboard** → Create a simple script that calls this endpoint.
