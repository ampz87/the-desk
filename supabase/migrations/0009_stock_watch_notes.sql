-- The Desk — Stock-monitoring notepad
-- Run this once in the Supabase SQL editor, after 0001-0008.

create table stock_watch_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz default now()
);

alter table stock_watch_notes enable row level security;

create policy "Authenticated full access" on stock_watch_notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
