-- Client Acquisition (Phase 1): cold outreach leads, their follow-up
-- sequence, and a log of what actually happened. Purely additive — new
-- tables only, nothing here touches clients/tasks/documents/etc.
--
-- Agency-only: no client account should ever see this data (it's
-- pre-client), so every table gets one blanket "agency members only"
-- policy rather than the client-scoped policies other tables have.

create table if not exists suppressed_contacts (
  email text primary key,
  company_name text,
  suppressed_at timestamptz not null default now()
);

alter table suppressed_contacts enable row level security;

create policy "Agency can read suppressed contacts" on suppressed_contacts
  for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create policy "Agency can write suppressed contacts" on suppressed_contacts
  for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create table if not exists leads (
  id bigint generated always as identity primary key,
  company_name text not null,
  website text,
  platform text,
  contact_name text,
  contact_email text,
  country text,
  why_fits text,
  noticed_note text,
  status text not null default 'new',
  owner text not null,
  not_now_until date,
  converted_client_id bigint references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leads enable row level security;

create policy "Agency can manage leads" on leads
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create table if not exists sequence_steps (
  id bigint generated always as identity primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  step_type text not null,
  due_date date not null,
  done boolean not null default false,
  done_at timestamptz,
  order_index int not null
);

alter table sequence_steps enable row level security;

create policy "Agency can manage sequence steps" on sequence_steps
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create table if not exists touches (
  id bigint generated always as identity primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table touches enable row level security;

create policy "Agency can manage touches" on touches
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create index if not exists leads_status_idx on leads(status);
create index if not exists sequence_steps_lead_id_idx on sequence_steps(lead_id);
create index if not exists sequence_steps_due_date_idx on sequence_steps(due_date) where done = false;
create index if not exists touches_lead_id_idx on touches(lead_id);
