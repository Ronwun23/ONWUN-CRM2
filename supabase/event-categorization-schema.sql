-- Adds category, color, and tags to events so the studio Calendar can
-- genuinely filter/color-code events, instead of faking it in the UI.
-- Run this once in the Supabase SQL editor.

alter table events
  add column if not exists category text,
  add column if not exists color text,
  add column if not exists tags jsonb;
