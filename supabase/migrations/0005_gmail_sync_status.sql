-- The Desk — Gmail sync staleness tracking
-- Run this once in the Supabase SQL editor, after 0001-0004.

create table gmail_sync_status (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  success boolean not null,
  message text
);

alter table gmail_sync_status enable row level security;

create policy "Authenticated full access" on gmail_sync_status
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
