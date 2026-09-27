-- Client Acquisition (Phase 3): monthly AI token usage for the "Find
-- companies" search, so it can enforce a budget cap and show a meter.
-- Only ever touched server-side via service_role (like the MCP OAuth
-- tables) — never exposed to the browser directly, so no agency RLS
-- policy is needed; RLS stays enabled with zero permissive policies.

create table if not exists ai_usage_monthly (
  month text primary key, -- 'YYYY-MM'
  tokens_used bigint not null default 0
);

alter table ai_usage_monthly enable row level security;
