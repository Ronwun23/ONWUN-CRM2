import { randomBytes, createHash } from 'crypto'
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js'
import type { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import type { OAuthClientInformationFull, OAuthTokenRevocationRequest, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import { supabaseAdmin, supabaseUrl, supabaseAnonKey } from './supabaseAdmin.js'

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 // 1 hour — refreshed transparently via the refresh token.
const AUTH_CODE_TTL_SECONDS = 60 * 10 // 10 minutes to complete the login+redirect round trip.

// authorize() (below) isn't given the incoming request, so it can't read
// the Host header the way every other handler in this folder does — but
// it still needs to know which origin it's running on (production, or one
// of Vercel's per-deployment preview URLs) to build a same-origin redirect
// to /mcp-connect. api/mcp-authorize.ts sets this from req.headers.host
// immediately before invoking the SDK's handler, which calls authorize()
// synchronously within that same request — safe because Node handles one
// request to completion per module instance before the next runs. A
// mutable container (not a reassigned export) because live ESM bindings
// can only be written from the module that exports them.
const originState = { current: 'https://onwun-crm-2.vercel.app' }
export function setCurrentRequestOrigin(origin: string) {
  originState.current = origin
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function randomToken(): string {
  return randomBytes(32).toString('hex')
}

interface ClientRow {
  client_id: string
  client_secret: string | null
  client_id_issued_at: number
  client_secret_expires_at: number | null
  redirect_uris: string[]
  client_name: string | null
  client_uri: string | null
  logo_uri: string | null
  scope: string | null
  contacts: string[] | null
  tos_uri: string | null
  policy_uri: string | null
  jwks_uri: string | null
  jwks: unknown
  software_id: string | null
  software_version: string | null
  grant_types: string[] | null
  response_types: string[] | null
  token_endpoint_auth_method: string | null
}

function rowToClient(row: ClientRow): OAuthClientInformationFull {
  return {
    client_id: row.client_id,
    client_secret: row.client_secret ?? undefined,
    client_id_issued_at: row.client_id_issued_at,
    client_secret_expires_at: row.client_secret_expires_at ?? undefined,
    redirect_uris: row.redirect_uris,
    client_name: row.client_name ?? undefined,
    client_uri: row.client_uri ?? undefined,
    logo_uri: row.logo_uri ?? undefined,
    scope: row.scope ?? undefined,
    contacts: row.contacts ?? undefined,
    tos_uri: row.tos_uri ?? undefined,
    policy_uri: row.policy_uri ?? undefined,
    jwks_uri: row.jwks_uri ?? undefined,
    jwks: row.jwks ?? undefined,
    software_id: row.software_id ?? undefined,
    software_version: row.software_version ?? undefined,
    grant_types: row.grant_types ?? undefined,
    response_types: row.response_types ?? undefined,
    token_endpoint_auth_method: row.token_endpoint_auth_method ?? undefined,
  }
}

export const clientsStore: OAuthRegisteredClientsStore = {
  async getClient(clientId) {
    const { data } = await supabaseAdmin().from('mcp_oauth_clients').select('*').eq('client_id', clientId).maybeSingle()
    return data ? rowToClient(data as ClientRow) : undefined
  },

  async registerClient(client) {
    const clientId = randomToken()
    const now = Math.floor(Date.now() / 1000)
    const row = {
      client_id: clientId,
      client_secret: null, // public client — PKCE only, no secret to leak.
      client_id_issued_at: now,
      client_secret_expires_at: null,
      redirect_uris: client.redirect_uris,
      client_name: client.client_name ?? null,
      client_uri: client.client_uri ?? null,
      logo_uri: client.logo_uri ?? null,
      scope: client.scope ?? null,
      contacts: client.contacts ?? null,
      tos_uri: client.tos_uri ?? null,
      policy_uri: client.policy_uri ?? null,
      jwks_uri: client.jwks_uri ?? null,
      jwks: client.jwks ?? null,
      software_id: client.software_id ?? null,
      software_version: client.software_version ?? null,
      grant_types: client.grant_types ?? null,
      response_types: client.response_types ?? null,
      token_endpoint_auth_method: client.token_endpoint_auth_method ?? 'none',
    }
    const { data, error } = await supabaseAdmin().from('mcp_oauth_clients').insert(row).select().single()
    if (error) throw error
    return rowToClient(data as ClientRow)
  },
}

// The actual "begin authorization" step redirects to our own React app,
// which reuses the existing magic-link login rather than us building a
// second login form — see src/pages/McpConnect.tsx. That page later posts
// back to /api/mcp-complete-authorize (below) once the person is signed
// in, which is what actually creates the auth code.
async function authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: import('express').Response) {
  const payload = {
    clientId: client.client_id,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    state: params.state,
    scope: params.scopes?.join(' '),
    resource: params.resource?.toString(),
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  res.redirect(302, `${originState.current}/mcp-connect?req=${encoded}`)
}

async function challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
  const { data } = await supabaseAdmin()
    .from('mcp_auth_codes')
    .select('code_challenge, client_id, expires_at')
    .eq('code', authorizationCode)
    .maybeSingle()
  if (!data || data.client_id !== client.client_id || new Date(data.expires_at) < new Date()) {
    throw new Error('Invalid or expired authorization code')
  }
  return data.code_challenge
}

async function exchangeAuthorizationCode(
  client: OAuthClientInformationFull,
  authorizationCode: string
): Promise<OAuthTokens> {
  const admin = supabaseAdmin()
  const { data: codeRow } = await admin
    .from('mcp_auth_codes')
    .select('*')
    .eq('code', authorizationCode)
    .eq('client_id', client.client_id)
    .maybeSingle()
  if (!codeRow || new Date(codeRow.expires_at) < new Date()) {
    throw new Error('Invalid or expired authorization code')
  }

  const accessToken = randomToken()
  const refreshToken = randomToken()
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000)

  const { error } = await admin.from('mcp_connections').insert({
    client_id: client.client_id,
    user_id: codeRow.user_id,
    access_token_hash: hashToken(accessToken),
    refresh_token_hash: hashToken(refreshToken),
    supabase_refresh_token: codeRow.supabase_refresh_token,
    scope: codeRow.scope,
    resource: codeRow.resource,
    access_token_expires_at: expiresAt.toISOString(),
  })
  if (error) throw error

  // One-time use — delete it whether or not this is a replay, so a
  // captured/replayed code never yields a second connection.
  await admin.from('mcp_auth_codes').delete().eq('code', authorizationCode)

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: codeRow.scope ?? undefined,
  }
}

async function exchangeRefreshToken(client: OAuthClientInformationFull, refreshToken: string): Promise<OAuthTokens> {
  const admin = supabaseAdmin()
  const { data: connection } = await admin
    .from('mcp_connections')
    .select('*')
    .eq('refresh_token_hash', hashToken(refreshToken))
    .eq('client_id', client.client_id)
    .maybeSingle()
  if (!connection) throw new Error('Invalid refresh token')

  const newAccessToken = randomToken()
  const newRefreshToken = randomToken()
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000)

  const { error } = await admin
    .from('mcp_connections')
    .update({
      access_token_hash: hashToken(newAccessToken),
      refresh_token_hash: hashToken(newRefreshToken),
      access_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', connection.id)
  if (error) throw error

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: connection.scope ?? undefined,
  }
}

async function verifyAccessToken(token: string): Promise<AuthInfo> {
  const admin = supabaseAdmin()
  const { data: connection } = await admin
    .from('mcp_connections')
    .select('id, client_id, user_id, scope, access_token_expires_at')
    .eq('access_token_hash', hashToken(token))
    .maybeSingle()
  if (!connection || new Date(connection.access_token_expires_at) < new Date()) {
    throw new Error('Invalid or expired access token')
  }
  admin
    .from('mcp_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', connection.id)
    .then(() => {})
  return {
    token,
    clientId: connection.client_id,
    scopes: connection.scope ? connection.scope.split(' ') : [],
    expiresAt: Math.floor(new Date(connection.access_token_expires_at).getTime() / 1000),
    extra: { connectionId: connection.id as string, userId: connection.user_id as string },
  }
}

async function revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
  const admin = supabaseAdmin()
  const hash = hashToken(request.token)
  await admin
    .from('mcp_connections')
    .delete()
    .eq('client_id', client.client_id)
    .or(`access_token_hash.eq.${hash},refresh_token_hash.eq.${hash}`)
}

export const oauthProvider: OAuthServerProvider = {
  clientsStore,
  authorize,
  challengeForAuthorizationCode,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  verifyAccessToken,
  revokeToken,
}

// Mints a fresh Supabase access token from a stored (long-lived) Supabase
// refresh token, and persists the rotated refresh token Supabase returns —
// GoTrue rotates refresh tokens on every use, so failing to save the new
// one would silently break the connection after its first real tool call.
export async function getFreshSupabaseAccessToken(connectionId: string): Promise<string> {
  const admin = supabaseAdmin()
  const { data: connection, error } = await admin
    .from('mcp_connections')
    .select('supabase_refresh_token')
    .eq('id', connectionId)
    .single()
  if (error || !connection) throw new Error('Connection not found')

  const res = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: supabaseAnonKey() },
    body: JSON.stringify({ refresh_token: connection.supabase_refresh_token }),
  })
  if (!res.ok) throw new Error('Failed to refresh Supabase session')
  const session = (await res.json()) as { access_token: string; refresh_token: string }

  await admin.from('mcp_connections').update({ supabase_refresh_token: session.refresh_token }).eq('id', connectionId)

  return session.access_token
}

export { AUTH_CODE_TTL_SECONDS }
