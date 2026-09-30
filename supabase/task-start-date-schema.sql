-- Optional start date for a task, so the client dashboard's Timeline strip
-- can render it as a bar spanning start_date..due_date instead of a single
-- day. Null means the task is single-day (renders exactly as before).
alter table public.tasks
  add column if not exists start_date date;
