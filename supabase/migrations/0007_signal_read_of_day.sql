-- The Desk — "Today's Read" automation
-- Run this once in the Supabase SQL editor, after 0001-0006.

create table signal_read_of_day (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text not null unique,      -- unique constraint enforces "never repeat an article"
  published_at timestamptz,
  shown_on date not null default current_date,
  fetched_at timestamptz default now()
);

alter table signal_read_of_day enable row level security;

create policy "Authenticated full access" on signal_read_of_day
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
