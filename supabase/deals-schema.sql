-- Client Acquisition pipeline: sales deals tracked against an existing
-- contact (lead). Deliberately separate from a lead's own outreach-
-- sequence `status` — a deal's stage is dragged by hand on the Pipeline
-- board, not something automation moves.

create table if not exists deals (
  id bigint generated always as identity primary key,
  title text not null,
  value numeric,
  currency text not null default 'USD',
  stage text not null default 'new',
  priority text not null default 'medium',
  contact_id bigint references leads(id) on delete set null,
  contact_name text,
  contact_country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table deals enable row level security;

create policy "Agency can manage deals" on deals
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

create index if not exists deals_stage_idx on deals(stage);
create index if not exists deals_contact_id_idx on deals(contact_id);
