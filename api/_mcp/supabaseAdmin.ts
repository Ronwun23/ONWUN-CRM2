import { createClient } from '@supabase/supabase-js'

// service_role bypasses RLS entirely — only ever used here, server-side,
// for the MCP OAuth tables (which have RLS enabled with zero policies, so
// nothing but service_role can touch them) and for minting fresh Supabase
// sessions from a stored refresh token.
export function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export function supabaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL
  if (!url) throw new Error('Missing VITE_SUPABASE_URL')
  return url
}

export function supabaseAnonKey(): string {
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing VITE_SUPABASE_ANON_KEY')
  return key
}
