# The Desk — PE/VC Study Portal

Personal daily-use portal for building PE/VC judgment skills. Phase 1: auth, Life Plan, Results Log, Signal (Daily tab). Phase 2: Benchmarks (DB-backed, D2C/Consumer populated so far), Mock IC (backlog/active workflow), Quiz (with per-concept accuracy feeding into Results Log), Signal Gmail automation + quick-capture forms, Signal Landscape (auto-fetched raw headlines, no summarization) with a freeform notes scratchpad, Today's Read (mechanical daily article pick, no LLM), static market reference links + a stock-watch notepad, and a live Google Sheet embed for Life Plan — all live.

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
- `0007_signal_read_of_day.sql` — `signal_read_of_day`
- `0008_landscape_notes.sql` — `landscape_notes`
- `0009_stock_watch_notes.sql` — `stock_watch_notes`

All tables have row-level security (authenticated-only access), **except `gmail_oauth_tokens`**, which has RLS enabled with zero policies — it holds a sensitive Gmail refresh token and is readable/writable only by the Supabase service role key (used server-side by the OAuth callback and the cron Worker), never by the app's normal authenticated session.

All quiz questions are still entered directly in the Supabase table editor. Benchmarks and Mock IC deals can now also be added through the app itself (see Quick capture below) as well as directly in Supabase. `quiz_questions.options` is a JSON array of `{id, text}`; `correct_option_id` must match one of those ids.

**`life_plan` and `signal_daily` are retired from the UI, not dropped from the database.** Life Plan is now a live Google Sheet embed instead of a table view (see below) — the `life_plan` table and its data still exist but nothing reads them any more. Similarly, every field `signal_daily` used to drive (digest summary, today's read, stocks to watch) has since been superseded by automation or a static panel, so it's no longer queried either. Both tables were left in place rather than dropped, in case either is ever wanted again.

Things written and saved from within the app itself:
- **Mock IC memos** — saving a memo for the first time on a given deal also logs a `memo_written` row in `results_log`.
- **Quiz answers** — every answer (right or wrong) inserts a new row into `quiz_answers`, building a history rather than overwriting a single status per question. Results Log's per-concept accuracy breakdown is computed live from this history.
- **Quick capture ("Log to Benchmarks" / "Log to Mock IC")** — available on the Today dashboard and inline within the raw Axios email view on Signal. New Mock IC deals always land in the backlog (`status = 'backlog'`); promote one to `'active'` from the Mock IC tab (a partial unique index enforces at most one active deal at a time).
- **Signal's Axios Pro Rata digest** — fetched automatically once daily by the `gmail-sync` Worker and stored unsummarized in `signal_axios_raw`; the Signal tab renders the most recent row's HTML (sanitized with DOMPurify before rendering).
- **Signal's Landscape tab** — the same Worker also fetches three RSS feeds daily (Economic Times Markets, Business Standard Economy, SCMP China Economy) and stores new items in `signal_landscape_items`, deduped on `url` via Postgres's ignore-duplicates upsert (no separate existence check needed). Each headline gets a crude keyword-based `region_tag` ('India' / 'US' / 'China' / null) — not semantic understanding, just substring matching, and intentionally left null rather than guessed when nothing matches. No LLM calls anywhere in this path.

  **Sources that didn't make it, and why** (confirmed by live-testing before building, not assumed): PIB was dropped — its RSS system has no ministry-specific feeds (the `Regid` parameter is a regional bureau like Delhi/Mumbai, not a ministry), and the one feed that returns any items at all serves Hindi text regardless of the `Lang` parameter, which also breaks English keyword region-tagging. Reuters was dropped — no working public RSS feed exists any more (the classic `feeds.reuters.com` URLs don't resolve, and reuters.com blocks non-browser requests with a Cloudflare challenge); only third-party scrapers produce anything Reuters-shaped, which wasn't in scope. Business Standard Economy and Nikkei Asia were the confirmed working replacements at launch. Nikkei Asia was itself dropped later — paywalled. Caixin Global's common RSS URL patterns all 404 (no working feed found); SCMP's China Economy feed checked out — several full articles fetched via a plain unauthenticated request returned genuine multi-paragraph body content, no paywall wall encountered — so it's the current China-focused source.

  Landscape items older than 48 hours are deleted by the Worker on every run (`fetched_at < now-48h`), and the frontend filters its display to the same 48h window — it's meant to read as "what's current," not an archive, so the two can't drift out of sync with each other.
- **Signal's Today's Read** — the same Worker also picks one article per day from 6 curated sources (Farnam Street, Of Dollars and Data, The Marginalian, Collaborative Fund, Ness Labs, Stratechery), storing it in `signal_read_of_day`. Selection is mechanical: among items published in the last ~7 days that haven't been shown before (a `unique` constraint on `url` makes repeats structurally impossible) *and* whose source wasn't picked in the last `SOURCE_COOLDOWN_DAYS` (4), it picks whichever was published most recently — no LLM, no topic weighting. If nothing new turns up on a given day, it shows no new read rather than forcing a repeat or a stale pick.

  **The per-source cooldown was added after launch, not part of the original design:** pure "most recent wins" had The Marginalian (which posts several times a day) winning almost every single day, since Stratechery (once/day, after this job's 6am UTC run), Farnam Street/Of Dollars and Data (weekly), and Collaborative Fund/Ness Labs (irregular) could essentially never have the single most-recent item across all sources. Confirmed by checking each feed's actual publish cadence rather than assuming. The cooldown falls back to ignoring itself if every remaining candidate is also on cooldown, so it never causes a day to show nothing that a candidate existed for.

  **Two source changes, both confirmed by testing, not assumed:** Daily Stoic's feed URL is genuinely correct (verified via the site's own feed auto-discovery tag) but the feed itself has gone stale — every item in it is dated 2021-2023, nothing recent. Replaced with The Marginalian, a same-spirit reflective-essay source confirmed actively publishing. Collaborative Fund isn't WordPress like the others — its working feed is at `/feed.xml`, not the `/feed/` path that 404s. Marginal Revolution was included at launch but removed shortly after — its feed turned out to be mostly link-roundup posts pointing to other (often paywalled) outlets like FT rather than original MR content, surfacing paywalled articles under MR's name. Dropped outright rather than trying to filter its feed.
- **Landscape notes** and **Stock-watch notes** — identical freeform-scratchpad pattern (textarea + save, running list newest-first, immediate no-confirmation delete applied optimistically and rolled back on failure), sharing one implementation (`useNotesTable`/`NotesBlock`) pointed at two separate tables (`landscape_notes` on the Landscape tab, `stock_watch_notes` on Signal Daily, in the old stocks-to-watch spot) so the two stay visually distinct and never mixed up. No linkage to specific headlines/stocks, no auto-archiving, no tagging — just plain running lists the user manages by deleting entries themselves.
- **Market reference links** — a static, hardcoded list (Gold Price, Brent Crude Oil, Currencies, Commodities) replacing the old manually-entered stocks-to-watch section on Signal Daily. No database table, no fetching — just glance-reference links that open in a new tab.
- **Life Plan** is now a live Google Sheet embed (`src/panels/LifePlan.jsx`) via the sheet's "Publish to web" URL, replacing the `life_plan` table view entirely (user's choice — the Sheet is the actual working document now). Published-to-web was chosen over a plain share-link `/edit` embed because it renders a clean table with no Sheets editor chrome, which is what "readable without leaving the portal" actually wants. Re-publishing is manual on the user's end if the sheet's structure changes enough to need a different `gid`.

## Gmail sync setup (one-time)

1. Cloudflare Pages project → Settings → Environment variables → add `GOOGLE_CLIENT_ID` (plain), `GOOGLE_CLIENT_SECRET` (Secret), `SUPABASE_URL` (plain), `SUPABASE_SERVICE_ROLE_KEY` (Secret).
2. Deploy the `workers/gmail-sync` Worker separately: `cd workers/gmail-sync && npx wrangler deploy`, then set its secrets: `npx wrangler secret put GOOGLE_CLIENT_ID` (and `GOOGLE_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` the same way).
3. Visit `https://the-desk-2y2.pages.dev/api/gmail/auth` once, logged in as the Google account that receives the Axios Pro Rata newsletter, and approve Gmail read access. The resulting refresh token is stored in `gmail_oauth_tokens`.
4. The Worker runs on two daily schedules (see `workers/gmail-sync/wrangler.toml`), branched on `event.cron` in `src/index.js`: Gmail/Axios sync at 15:30 UTC (21:00 IST, timed to run after the newsletter actually arrives ~19:30 IST), Landscape + Today's Read at 06:00 UTC (11:30 IST). To test without waiting for either schedule, hit the deployed Worker's `/sync`, `/sync-landscape`, or `/sync-read` routes directly.

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
