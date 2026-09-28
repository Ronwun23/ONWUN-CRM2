-- In-portal contract signing (src/components/ContractSignaturePanel.tsx,
-- src/components/SignaturePad.tsx) — each side's signature is a drawn PNG
-- data URL plus who signed and when. Missing until now: this was built and
-- shipped in the app code without ever running against the database, which
-- broke every document/client insert with PGRST204 "Could not find the
-- 'agency_signature_author_name' column" — insertDocument sends all six
-- columns on every insert, not just signed ones, so a brand-new client
-- with its starter document checklist failed just as hard as a real
-- contract signing would have.
alter table documents add column if not exists agency_signature_data text;
alter table documents add column if not exists agency_signature_author_name text;
alter table documents add column if not exists agency_signature_created_at timestamptz;
alter table documents add column if not exists client_signature_data text;
alter table documents add column if not exists client_signature_author_name text;
alter table documents add column if not exists client_signature_created_at timestamptz;
