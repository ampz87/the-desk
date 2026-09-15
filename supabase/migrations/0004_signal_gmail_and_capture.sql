-- The Desk — Signal Gmail automation + capture forms
-- Run this once in the Supabase SQL editor, after 0001-0003.

-- ============================================================
-- Benchmarks: migrate from static-in-React to a real table
-- ============================================================
create table benchmarks (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  parameter text not null,
  range_label text not null,
  rationale text not null,
  source text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table benchmarks enable row level security;

create policy "Authenticated full access" on benchmarks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Carry over the existing D2C/Consumer rows that were hardcoded in the app
insert into benchmarks (sector, parameter, range_label, rationale, sort_order) values
  ('D2C / Consumer', 'Gross margin', '40–60%', 'Below 40% usually means heavy discounting or a weak supply chain position; above 60% is common only where brand premium is real, not promotional.', 1),
  ('D2C / Consumer', 'EBITDA %', '8–15%', 'Pre-scale D2C often runs thinner or negative; double digits sustained signals the growth spend is actually converting, not just buying revenue.', 2),
  ('D2C / Consumer', 'Marketing spend (% revenue)', '15–25%', 'Early-stage D2C leans higher to buy growth; above 30% sustained is a red flag on unit economics, not a growth signal.', 3),
  ('D2C / Consumer', 'CAC payback', '6–12 months', 'Longer than a year and the business is effectively financing its own growth — fine with strong repeat rates, risky without.', 4),
  ('D2C / Consumer', 'ROCE (at scale)', '15–20%', 'Anchor point borrowed from listed peer screening — same lens used on BEL/NTPC, applied to what a mature version of this business should look like.', 5),
  ('D2C / Consumer', 'ROA', '8–12%', 'Asset-light D2C should clear this comfortably; a miss here usually means inventory or working capital is heavier than the model assumes.', 6),
  ('D2C / Consumer', 'Revenue growth (YoY)', '50–100%+', 'Expected at Series A/B stage; deceleration below ~40% without a stated reason is worth probing in the memo.', 7),
  ('D2C / Consumer', 'Debt / Equity', '< 0.3x', 'Venture-backed D2C is usually equity-funded pre-scale; meaningful debt this early can mean working-capital strain, not leverage strategy.', 8),
  ('D2C / Consumer', 'Beta (if listed comp)', '0.8–1.3', 'Used only when benchmarking against a listed peer for volatility context — less relevant pre-IPO, more useful once comping against public consumer names.', 9);

-- ============================================================
-- Mock IC: backlog / active workflow
-- ============================================================
alter table mock_ic_deals
  add column status text not null default 'backlog'
  check (status in ('backlog', 'active'));

-- Enforce "at most one active deal" at the database level
create unique index mock_ic_deals_one_active on mock_ic_deals (status) where status = 'active';

-- Promote whatever was already the latest deal (by week_of) so the app
-- doesn't go blank after this migration — safe no-op if the table is empty.
update mock_ic_deals set status = 'active'
where id = (select id from mock_ic_deals order by week_of desc nulls last limit 1);

-- ============================================================
-- Gmail OAuth token storage — service_role only, no app-user access.
-- RLS is enabled with zero policies, so the anon/authenticated roles are
-- denied entirely; only the service role key (used server-side by the
-- Pages Function callback and the cron Worker) can read or write here.
-- ============================================================
create table gmail_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  refresh_token text not null,
  created_at timestamptz default now()
);

alter table gmail_oauth_tokens enable row level security;

-- ============================================================
-- Raw Axios Pro Rata email storage (unsummarized)
-- ============================================================
create table signal_axios_raw (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  received_at timestamptz not null,
  body_html text,
  body_text text,
  fetched_at timestamptz default now()
);

alter table signal_axios_raw enable row level security;

create policy "Authenticated full access" on signal_axios_raw
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
