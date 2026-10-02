-- Which client a studio-calendar event is with — an optional tag shown
-- next to the event title, separate from events.client_id (which scopes
-- a per-client content-calendar event to its owner, not who a studio
-- meeting is with).
alter table public.events
  add column if not exists with_client_id bigint references public.clients(id) on delete set null,
  add column if not exists with_client_name text;
