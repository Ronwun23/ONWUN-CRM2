-- Client Acquisition (Phase 2): the outreach brief that drives
-- AI-drafted emails. A singleton — one row for the whole studio, kept
-- in its own table rather than added to acquisition-schema.sql's
-- per-lead tables since it's a different shape of thing (a document,
-- not a list). Purely additive; same agency-only RLS as the others.

create table if not exists acquisition_profile (
  id bigint generated always as identity primary key,
  niche text not null,
  countries text not null,
  who_exactly text,
  what_we_sell text,
  price text,
  call_days text,
  past_work_what text,
  past_work_why text,
  updated_at timestamptz not null default now()
);

alter table acquisition_profile enable row level security;

create policy "Agency can manage the acquisition profile" on acquisition_profile
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));
