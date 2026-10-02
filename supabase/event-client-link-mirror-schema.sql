-- Tracks the mirrored copy of a studio event living on the selected
-- client's own events list, so edits/deletes on the studio side can
-- keep that client-portal copy in sync (see event-client-link-schema.sql
-- for with_client_id/with_client_name, added first).
alter table public.events
  add column if not exists linked_client_event_id bigint references public.events(id) on delete set null;
