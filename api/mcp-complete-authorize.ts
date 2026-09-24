import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { supabaseAdmin, supabaseUrl, supabaseAnonKey } from './_mcp/supabaseAdmin.js'

const AUTH_CODE_TTL_SECONDS = 60 * 10

interface PendingAuthorize {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state?: string
  scope?: string
  resource?: string
}

// Called by src/pages/McpConnect.tsx once the person has actually signed
// in — turns "this Supabase session" + "this pending OAuth request" into
// a one-time authorization code, and hands back the URL to send them to
// (Claude's own redirect_uri) to finish the connection.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { req: encodedRequest, supabaseAccessToken } = (req.body ?? {}) as {
    req?: string
    supabaseAccessToken?: string
  }
  if (!encodedRequest || !supabaseAccessToken) {
    res.status(400).json({ error: 'Missing req or supabaseAccessToken' })
    return
  }

  let pending: PendingAuthorize
  try {
    pending = JSON.parse(Buffer.from(encodedRequest, 'base64url').toString('utf8'))
  } catch {
    res.status(400).json({ error: 'Malformed authorization request' })
    return
  }

  // Verify the token is a real, live Supabase session — never trust a
  // client-supplied user id.
  const userRes = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${supabaseAccessToken}`, apikey: supabaseAnonKey() },
  })
  if (!userRes.ok) {
    res.status(401).json({ error: 'Invalid Supabase session' })
    return
  }
  const user = (await userRes.json()) as { id: string }

  const { supabaseRefreshToken } = (req.body ?? {}) as { supabaseRefreshToken?: string }
  if (!supabaseRefreshToken) {
    res.status(400).json({ error: 'Missing supabaseRefreshToken' })
    return
  }

  const admin = supabaseAdmin()
  const code = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000)

  const { error } = await admin.from('mcp_auth_codes').insert({
    code,
    client_id: pending.clientId,
    user_id: user.id,
    code_challenge: pending.codeChallenge,
    redirect_uri: pending.redirectUri,
    scope: pending.scope ?? null,
    resource: pending.resource ?? null,
    supabase_refresh_token: supabaseRefreshToken,
    expires_at: expiresAt.toISOString(),
  })
  if (error) {
    console.error('mcp-complete-authorize insert error:', error)
    res.status(500).json({ error: 'Could not create authorization code' })
    return
  }

  const redirect = new URL(pending.redirectUri)
  redirect.searchParams.set('code', code)
  if (pending.state) redirect.searchParams.set('state', pending.state)

  res.status(200).json({ redirectTo: redirect.toString() })
}
