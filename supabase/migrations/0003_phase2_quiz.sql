-- The Desk — Phase 2: Quiz
-- Run this once in the Supabase SQL editor, after 0001 and 0002.

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question_type text not null,   -- 'recall' | 'judgment'
  concept text not null,          -- e.g. 'Cap tables', 'Comps', 'DCF assumptions', 'Liquidation preferences'
  sector text,                    -- optional, e.g. 'D2C', 'Banking'
  prompt text not null,
  options jsonb not null,         -- array of {id, text}
  correct_option_id text not null,
  explanation text not null,
  created_at timestamptz default now()
);

create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references quiz_questions(id),
  selected_option_id text not null,
  is_correct boolean not null,
  answered_at timestamptz default now()
);

alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;

create policy "Authenticated full access" on quiz_questions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on quiz_answers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
