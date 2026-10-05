alter table public.documents
  add column if not exists agency_signed_off boolean not null default false,
  add column if not exists client_signed_off boolean not null default false;
