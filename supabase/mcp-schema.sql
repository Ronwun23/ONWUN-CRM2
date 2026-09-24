-- MCP (Model Context Protocol) OAuth + connection tables.
-- These are only ever touched via the service_role key from serverless
-- functions (api/_mcp/*) — never exposed to the browser, so no RLS
-- policies are needed; RLS stays enabled with zero permissive policies,
-- which denies all access except service_role (which bypasses RLS).

create table if not exists mcp_oauth_clients (
  client_id text primary key,
  client_secret text,
  client_id_issued_at bigint not null,
  client_secret_expires_at bigint,
  redirect_uris jsonb not null,
  client_name text,
  client_uri text,
  logo_uri text,
  scope text,
  contacts jsonb,
  tos_uri text,
  policy_uri text,
  jwks_uri text,
  jwks jsonb,
  software_id text,
  software_version text,
  grant_types jsonb,
  response_types jsonb,
  token_endpoint_auth_method text,
  created_at timestamptz not null default now()
);

alter table mcp_oauth_clients enable row level security;

create table if not exists mcp_auth_codes (
  code text primary key,
  client_id text not null references mcp_oauth_clients(client_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_challenge text not null,
  redirect_uri text not null,
  scope text,
  resource text,
  supabase_refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table mcp_auth_codes enable row level security;

create table if not exists mcp_connections (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references mcp_oauth_clients(client_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token_hash text not null unique,
  refresh_token_hash text not null unique,
  supabase_refresh_token text not null,
  scope text,
  resource text,
  access_token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table mcp_connections enable row level security;

create index if not exists mcp_connections_user_id_idx on mcp_connections(user_id);
create index if not exists mcp_auth_codes_expires_at_idx on mcp_auth_codes(expires_at);
