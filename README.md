# The Desk — PE/VC Study Portal

Personal daily-use portal for building PE/VC judgment skills. Phase 1: auth, Life Plan, Results Log, Signal (Daily tab). Phase 2: Benchmarks (DB-backed, D2C/Consumer populated so far), Mock IC (backlog/active workflow), Quiz (with per-concept accuracy feeding into Results Log), Signal Gmail automation + quick-capture forms, and Signal Landscape (auto-fetched raw headlines, no summarization) — all live.

## Stack

- React + Vite (static SPA), deployed on Cloudflare Pages
- Supabase (Postgres + Auth, magic-link email)
- Cloudflare Pages Functions (`functions/`) for the Gmail OAuth flow
- A separate Cloudflare Worker (`workers/gmail-sync/`) for the daily Gmail cron fetch

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

To test the Gmail OAuth Pages Functions locally, copy `.dev.vars.example` to `.dev.vars` (gitignored) and fill in real values, then run `npx wrangler pages dev -- npm run dev`.

## Database setup

Run the migrations in [`supabase/migrations/`](supabase/migrations/) in order, in the Supabase SQL editor:

- `0001_phase1_schema.sql` — `life_plan`, `results_log`, `signal_daily`
- `0002_phase2_mockic.sql` — `mock_ic_deals`, `mock_ic_memos`
- `0003_phase2_quiz.sql` — `quiz_questions`, `quiz_answers`
- `0004_signal_gmail_and_capture.sql` — `benchmarks`, `gmail_oauth_tokens`, `signal_axios_raw`, plus a `status` column on `mock_ic_deals`
- `0005_gmail_sync_status.sql` — `gmail_sync_status`, so the app can tell you when the daily sync has stopped working
- `0006_signal_landscape.sql` — `signal_landscape_items`

All tables have row-level security (authenticated-only access), **except `gmail_oauth_tokens`**, which has RLS enabled with zero policies — it holds a sensitive Gmail refresh token and is readable/writable only by the Supabase service role key (used server-side by the OAuth callback and the cron Worker), never by the app's normal authenticated session.

Life Plan, Signal (`signal_daily`), and all quiz questions are still entered directly in the Supabase table editor. Benchmarks and Mock IC deals can now also be added through the app itself (see Quick capture below) as well as directly in Supabase. `quiz_questions.options` is a JSON array of `{id, text}`; `correct_option_id` must match one of those ids.

Things written and saved from within the app itself:
- **Mock IC memos** — saving a memo for the first time on a given deal also logs a `memo_written` row in `results_log`.
- **Quiz answers** — every answer (right or wrong) inserts a new row into `quiz_answers`, building a history rather than overwriting a single status per question. Results Log's per-concept accuracy breakdown is computed live from this history.
- **Quick capture ("Log to Benchmarks" / "Log to Mock IC")** — available on the Today dashboard and inline within the raw Axios email view on Signal. New Mock IC deals always land in the backlog (`status = 'backlog'`); promote one to `'active'` from the Mock IC tab (a partial unique index enforces at most one active deal at a time).
- **Signal's Axios Pro Rata digest** — fetched automatically once daily by the `gmail-sync` Worker and stored unsummarized in `signal_axios_raw`; the Signal tab renders the most recent row's HTML (sanitized with DOMPurify before rendering).
- **Signal's Landscape tab** — the same Worker also fetches three RSS feeds daily (Economic Times Markets, Business Standard Economy, Nikkei Asia) and stores new items in `signal_landscape_items`, deduped on `url` via Postgres's ignore-duplicates upsert (no separate existence check needed). Each headline gets a crude keyword-based `region_tag` ('India' / 'US' / 'China' / null) — not semantic understanding, just substring matching, and intentionally left null rather than guessed when nothing matches. No LLM calls anywhere in this path.

  **Sources that didn't make it, and why** (confirmed by live-testing before building, not assumed): PIB was dropped — its RSS system has no ministry-specific feeds (the `Regid` parameter is a regional bureau like Delhi/Mumbai, not a ministry), and the one feed that returns any items at all serves Hindi text regardless of the `Lang` parameter, which also breaks English keyword region-tagging. Reuters was dropped — no working public RSS feed exists any more (the classic `feeds.reuters.com` URLs don't resolve, and reuters.com blocks non-browser requests with a Cloudflare challenge); only third-party scrapers produce anything Reuters-shaped, which wasn't in scope. Business Standard Economy and Nikkei Asia were confirmed working replacements.

## Gmail sync setup (one-time)

1. Cloudflare Pages project → Settings → Environment variables → add `GOOGLE_CLIENT_ID` (plain), `GOOGLE_CLIENT_SECRET` (Secret), `SUPABASE_URL` (plain), `SUPABASE_SERVICE_ROLE_KEY` (Secret).
2. Deploy the `workers/gmail-sync` Worker separately: `cd workers/gmail-sync && npx wrangler deploy`, then set its secrets: `npx wrangler secret put GOOGLE_CLIENT_ID` (and `GOOGLE_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` the same way).
3. Visit `https://the-desk-2y2.pages.dev/api/gmail/auth` once, logged in as the Google account that receives the Axios Pro Rata newsletter, and approve Gmail read access. The resulting refresh token is stored in `gmail_oauth_tokens`.
4. The Worker's cron trigger (daily, see `workers/gmail-sync/wrangler.toml`) picks up new matching emails from then on. To test without waiting for the schedule, hit the deployed Worker's `/sync` route directly.

**A real limitation, not a bug:** the Google Cloud OAuth app is in "Testing" publishing status (the practical option for a personal project — `gmail.readonly` is a restricted scope, and full verification to leave Testing mode can require a paid third-party security assessment). Testing-mode apps get test users added explicitly (Google Cloud Console → OAuth consent screen → Test users), and their refresh tokens **expire after 7 days regardless of use** — so plan to redo step 3 roughly weekly. If you forget, you won't be left guessing: the Worker records every run (success or failure) to `gmail_sync_status`, and the Signal tab shows a visible warning — with the actual error message — whenever the last run failed or it's been more than 36 hours since a successful one.

## Deployment

The main site is connected to Cloudflare Pages via GitHub — every push to `main` triggers a build (`npm run build`, output directory `dist`) and deploy automatically, including anything under `functions/`. The `workers/gmail-sync` Worker is a separate deployable and is **not** part of this auto-deploy — redeploy it manually (`npx wrangler deploy` from that directory) after changing its code.

## Environment variables

| Variable | Where it's used |
|---|---|
| `VITE_SUPABASE_URL` | Local `.env.local` and Cloudflare Pages project settings |
| `VITE_SUPABASE_ANON_KEY` | Local `.env.local` and Cloudflare Pages project settings (publishable key, safe for client-side) |
| `GOOGLE_CLIENT_ID` | Cloudflare Pages env vars (plain) and the `gmail-sync` Worker secrets |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Pages env vars (Secret) and the `gmail-sync` Worker secrets — never in `VITE_`-prefixed vars, never in the browser bundle |
| `SUPABASE_URL` | Same value as `VITE_SUPABASE_URL`, set separately (un-prefixed) for Pages Functions and the Worker |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Pages env vars (Secret) and the `gmail-sync` Worker secrets — bypasses RLS, used only server-side, never in the browser bundle |
