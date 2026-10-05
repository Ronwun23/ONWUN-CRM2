-- The signature page as generated at upload time — blank boxes, nothing
-- signed yet. Every restamp (after either party signs) is drawn fresh
-- from this file, not from the current (possibly already-stamped) url,
-- so signing twice in a row can never double-stamp the same PDF.
alter table public.documents
  add column if not exists unstamped_url text;
