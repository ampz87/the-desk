-- The Desk — Signal Landscape tab
-- Run this once in the Supabase SQL editor, after 0001-0005.

create table signal_landscape_items (
  id uuid primary key default gen_random_uuid(),
  source text not null,          -- 'Economic Times Markets' | 'Business Standard Economy' | 'Nikkei Asia'
  headline text not null,
  url text not null unique,      -- unique constraint powers ignore-duplicates dedup on insert
  published_at timestamptz,      -- null when the source feed doesn't publish one (e.g. Nikkei Asia)
  fetched_at timestamptz default now(),
  region_tag text                -- 'India' | 'US' | 'China' | null — simple keyword match, not guessed
);

alter table signal_landscape_items enable row level security;

create policy "Authenticated full access" on signal_landscape_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
