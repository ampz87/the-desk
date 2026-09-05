-- The Desk — Phase 1 schema
-- Run this once in the Supabase SQL editor (see manual setup steps).

create table if not exists life_plan (
  id uuid primary key default gen_random_uuid(),
  pillar text not null,
  deliverable text not null,
  status text not null,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists results_log (
  id uuid primary key default gen_random_uuid(),
  metric_type text not null,
  label text,
  logged_at timestamptz default now()
);

create table if not exists signal_daily (
  id uuid primary key default gen_random_uuid(),
  digest_summary text,
  article_title text,
  article_url text,
  article_source text,
  stocks_to_watch jsonb,
  entry_date date default current_date
);

-- Single-user app: any authenticated request may read/write. Anonymous
-- (unauthenticated) requests are blocked entirely since RLS defaults to
-- deny with no matching policy.
alter table life_plan enable row level security;
alter table results_log enable row level security;
alter table signal_daily enable row level security;

create policy "Authenticated full access" on life_plan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on results_log
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on signal_daily
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
