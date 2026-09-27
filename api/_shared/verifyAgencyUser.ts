// Shared by every AI endpoint (generate-strategy, draft-outreach-email,
// find-companies) — confirms the bearer token belongs to a signed-in
// agency account before spending any Anthropic tokens on their behalf.
export async function verifyAgencyUser(accessToken: string): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceKey) return false

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
  })
  if (!userRes.ok) return false
  const user = (await userRes.json()) as { id?: string }
  if (!user.id) return false

  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  })
  if (!profileRes.ok) return false
  const profiles = (await profileRes.json()) as { role?: string }[]
  return profiles[0]?.role === 'agency'
}
