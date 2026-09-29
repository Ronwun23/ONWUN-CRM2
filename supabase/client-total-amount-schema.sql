-- The full project/contract value, set once per client from the
-- Invoices page — shown next to the Open total so both the agency and
-- the client can see how much of the total has been invoiced so far.
alter table public.clients
  add column if not exists total_amount numeric;
