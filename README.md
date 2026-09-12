# The Desk — PE/VC Study Portal

Personal daily-use portal for building PE/VC judgment skills. Phase 1: auth, Life Plan, Results Log, Signal (Daily tab). Phase 2 (in progress): Benchmarks (D2C/Consumer sector only so far), Mock IC. Quiz is still a "coming soon" placeholder.

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

Run the migrations in [`supabase/migrations/`](supabase/migrations/) in order, in the Supabase SQL editor:

- `0001_phase1_schema.sql` — `life_plan`, `results_log`, `signal_daily`
- `0002_phase2_mockic.sql` — `mock_ic_deals`, `mock_ic_memos`

All tables have row-level security (authenticated-only access).

Life Plan, Signal, and this week's Mock IC deal facts are entered directly in the Supabase table editor — no in-app forms yet. Mock IC memos are the one thing written and saved from within the app itself; saving a memo for the first time on a given deal also logs a `memo_written` row in `results_log`.

## Deployment

Connected to Cloudflare Pages via GitHub — every push to `main` triggers a build (`npm run build`, output directory `dist`) and deploy automatically.

## Environment variables

| Variable | Where it's used |
|---|---|
| `VITE_SUPABASE_URL` | Local `.env.local` and Cloudflare Pages project settings |
| `VITE_SUPABASE_ANON_KEY` | Local `.env.local` and Cloudflare Pages project settings (publishable key, safe for client-side) |
