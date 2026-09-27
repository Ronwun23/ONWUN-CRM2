-- Lets api/calendly-sync.ts upsert synced bookings without duplicating them
-- on every re-run (see api/calendly-sync.ts's onConflict: 'calendly_uri').
alter table events add column if not exists calendly_uri text unique;
