-- RLS policy for `events` (the table itself already exists, created in the
-- Supabase dashboard — this just documents and (re)applies its access rules,
-- since unlike `deals`/`leads` it was never committed here).
--
-- Same dual-scope shape as `tasks` and `updates`: client_id is nullable.
--   - client_id is null   -> a studio-wide event (shoots, launches, team
--     days — see src/pages/studio/Calendar.tsx). Agency-only; a client must
--     never see these.
--   - client_id is set    -> belongs to that client's portal (their Content
--     Calendar — src/pages/client/ContentCalendar.tsx). Agency has full
--     access; that one client can manage only their own rows.
--
-- Safe to re-run: drops each policy by name before recreating it, and
-- enabling RLS on an already-RLS table is a no-op.

alter table events enable row level security;

drop policy if exists "Agency can manage all events" on events;
create policy "Agency can manage all events" on events
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'agency'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'agency'));

drop policy if exists "Clients can manage their own events" on events;
create policy "Clients can manage their own events" on events
  for all
  using (
    client_id is not null
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'client' and profiles.client_id = events.client_id
    )
  )
  with check (
    client_id is not null
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'client' and profiles.client_id = events.client_id
    )
  );

create index if not exists events_client_id_idx on events(client_id);
