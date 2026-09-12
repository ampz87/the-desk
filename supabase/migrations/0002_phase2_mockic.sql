-- The Desk — Phase 2: Mock IC
-- Run this once in the Supabase SQL editor, after 0001_phase1_schema.sql.

create table if not exists mock_ic_deals (
  id uuid primary key default gen_random_uuid(),
  deal_name text not null,
  stage text,
  sector text,
  location text,
  source_note text,
  round_size text,
  post_money text,
  revenue text,
  yoy_growth text,
  gross_margin text,
  lead_investor text,
  memo_prompt text,
  week_of date default current_date
);

create table if not exists mock_ic_memos (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references mock_ic_deals(id) on delete cascade,
  memo_text text not null default '',
  saved_at timestamptz default now(),
  unique (deal_id)
);

alter table mock_ic_deals enable row level security;
alter table mock_ic_memos enable row level security;

create policy "Authenticated full access" on mock_ic_deals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on mock_ic_memos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
