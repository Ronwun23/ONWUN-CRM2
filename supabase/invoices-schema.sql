-- Invoice-specific fields on documents, for the dedicated Invoices view
-- (type = 'invoice'). Payment state reuses the existing status column's
-- 'paid'/'unpaid' values; approval is new since nothing else covers it.

alter table public.documents
  add column if not exists invoice_number text,
  add column if not exists billed_to_name text,
  add column if not exists issued_date date,
  add column if not exists due_date date,
  add column if not exists amount numeric,
  add column if not exists invoice_approved boolean;
