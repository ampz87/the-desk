# The Desk — PE/VC Study Portal

Personal daily-use portal for building PE/VC judgment skills. Phase 1: auth, Life Plan, Results Log, Signal (Daily tab). Quiz, Benchmarks, and Mock IC are Phase 2+ and appear as "coming soon" placeholders.

## Stack

- React + Vite (static SPA)
- Supabase (Postgres + Auth, magic-link email)
- Cloudflare Pages (auto-deploy from `main`)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

## Database setup

Run [`supabase/migrations/0001_phase1_schema.sql`](supabase/migrations/0001_phase1_schema.sql) in the Supabase SQL editor to create the `life_plan`, `results_log`, and `signal_daily` tables with row-level security.

Phase 1 data is entered directly in the Supabase table editor — no in-app forms yet.

## Deployment

Connected to Cloudflare Pages via GitHub — every push to `main` triggers a build (`npm run build`, output directory `dist`) and deploy automatically.

## Environment variables

| Variable | Where it's used |
|---|---|
| `VITE_SUPABASE_URL` | Local `.env.local` and Cloudflare Pages project settings |
| `VITE_SUPABASE_ANON_KEY` | Local `.env.local` and Cloudflare Pages project settings (publishable key, safe for client-side) |
