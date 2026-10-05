-- Where the agency has marked the signature/date blanks on a contract's
-- final page. Stored once per contract (jsonb, like clients.phases) and
-- used to stamp both signatures directly onto the real PDF once both
-- parties have signed.
alter table public.documents
  add column if not exists stamp_layout jsonb;
