-- The Desk — Landscape Notes
-- Run this once in the Supabase SQL editor, after 0001-0007.

create table landscape_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz default now()
);

alter table landscape_notes enable row level security;

create policy "Authenticated full access" on landscape_notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
