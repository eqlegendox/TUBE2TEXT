# TubeIntel — Deployment Guide

Follow these steps **in order**. Each section builds on the previous one.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → choose a name (e.g. `tubeintel`) → set a database password → create
3. Wait ~2 minutes for the project to spin up

### Run the database schema

1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Open `supabase_schema.sql` from this repo root
3. Copy-paste the entire file into the SQL editor and click **Run**

You should see two new tables: `user_keys` and `modules`

### Enable Email Auth

1. Go to **Authentication → Providers → Email**
2. Make sure it is enabled (it usually is by default)
3. Optionally turn off "Confirm email" during development so you can test without clicking an email link

### Copy your Supabase credentials

Go to **Settings → API** and copy these three values — you'll need them shortly:

| Value | Where to find it |
|---|---|
| `Project URL` | "Project URL" box |
| `anon` key | "Project API keys" → `anon public` |
| `service_role` key | "Project API keys" → `service_role` (click to reveal) |

---

## Step 2 — Deploy the backend to Railway

1. Go to [railway.app](https://railway.app) and create a free account
2. Click **New Project → Deploy from GitHub repo**
3. Connect your GitHub account and select the TUBE2TEXT repo
4. When prompted for the root directory, set it to **`backend`**
5. Railway will detect Python and use Nixpacks automatically

### Set environment variables in Railway dashboard

Go to your Railway service → **Variables** tab → add each key:

| Variable | Value |
|---|---|
| `SUPADATA_API_KEY` | Supadata API key — fetches YouTube transcripts |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GROQ_API_KEY` | Your Groq API key (optional) |
| `NOTION_API_KEY` | Your Notion integration token (optional) |
| `NOTION_DATABASE_ID` | Your Notion database ID (optional) |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API v3 key — enables /discover recommendations |
| `ALLOWED_ORIGINS` | Your Vercel URL e.g. `https://your-app.vercel.app` — restricts CORS |
| `SETUP_TOKEN` | Random secret (e.g. `openssl rand -hex 16`) — protects the `/setup` page |

Railway automatically sets `PORT` and `RAILWAY_ENVIRONMENT` — do not add these yourself.

### Get your Railway URL

After the first deploy succeeds, go to **Settings → Domains** and copy the public URL.
It will look like: `https://tubeintel-production.up.railway.app`

**Test it:**
```
curl https://YOUR-RAILWAY-URL/health
# Should return: {"status":"ok","ai_provider":"gemini"}
```

---

## Step 3 — Deploy the frontend to Vercel

### Option A: Deploy from the Vercel dashboard

1. Go to [vercel.com](https://vercel.com) and create a free account
2. Click **Add New → Project → Import Git Repository**
3. Select the TUBE2TEXT repo
4. Set **Root Directory** to `frontend`
5. Framework will be detected as Next.js automatically

### Option B: Deploy via CLI

```bash
cd frontend
npm i -g vercel
vercel
# Follow prompts — link to your Vercel account
```

### Set environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key | All |
| `NEXT_PUBLIC_BACKEND_URL` | Your Railway URL (from Step 2) | All |

After adding vars, click **Redeploy** so they take effect.

### Add your Vercel URL to Supabase

1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `https://YOUR-VERCEL-APP.vercel.app`
3. Add to **Redirect URLs**: `https://YOUR-VERCEL-APP.vercel.app/auth/callback`

---

## Step 4 — Update the Chrome Extension backend URL

1. Open `extension/popup.js`
2. Change line 2:
   ```js
   const BACKEND_URL = "https://YOUR-RAILWAY-URL";
   ```
3. Go to `chrome://extensions` → click **Reload** on the TUBE2TEXT extension

The extension will now call the cloud backend instead of localhost.

---

## Step 5 — Update `.env.local` for local development

Edit `frontend/.env.local` and fill in your real values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

For local dev, keep `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` so the frontend hits your local Python server.

To run locally:
```bash
# Terminal 1 — backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

---

## Summary: What lives where

| Component | Platform | URL |
|---|---|---|
| FastAPI backend | Railway | `https://tubeintel.railway.app` (example) |
| Next.js frontend | Vercel | `https://tubeintel.vercel.app` (example) |
| Database + Auth | Supabase | Managed |
| Chrome Extension | Local (your browser) | Calls Railway directly |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/health` returns 502 on Railway | Check Railway logs for Python errors; verify `GEMINI_API_KEY` is set |
| "No AI API key configured" on frontend | Go to Settings → API Keys in the web app and save your keys |
| Auth redirect loop | Check Supabase → Authentication → URL Configuration has your Vercel URL |
| Extension shows "Could not connect" | Verify `BACKEND_URL` in `popup.js` matches your Railway URL |
| Notion save failing | Check that your Notion integration is connected to the database and `NOTION_DATABASE_ID` is correct |
