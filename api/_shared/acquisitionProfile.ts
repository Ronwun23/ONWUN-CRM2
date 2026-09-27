// Shared by draft-outreach-email and find-companies — both need the
// studio's outreach brief server-side.
export interface AcquisitionProfileRow {
  niche: string
  countries: string
  who_exactly: string | null
  what_we_sell: string | null
  price: string | null
  call_days: string | null
  past_work_what: string | null
  past_work_why: string | null
}

export async function fetchAcquisitionProfileRow(): Promise<AcquisitionProfileRow | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null

  const res = await fetch(`${supabaseUrl}/rest/v1/acquisition_profile?select=*&order=id.asc&limit=1`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  })
  if (!res.ok) return null
  const rows = (await res.json()) as AcquisitionProfileRow[]
  return rows[0] ?? null
}

export function briefLines(profile: AcquisitionProfileRow): string[] {
  return [
    `Niche we target: ${profile.niche}`,
    `Countries: ${profile.countries}`,
    profile.who_exactly && `Who exactly: ${profile.who_exactly}`,
    profile.what_we_sell && `What we sell: ${profile.what_we_sell}`,
    profile.price && `Price: ${profile.price}`,
    profile.call_days && `Days we take calls: ${profile.call_days}`,
    profile.past_work_what && `Past work in this niche — what we did: ${profile.past_work_what}`,
    profile.past_work_why && `Past work in this niche — why it was valuable: ${profile.past_work_why}`,
  ].filter((line): line is string => Boolean(line))
}
