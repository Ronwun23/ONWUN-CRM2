// Tracks monthly Anthropic token spend for the "Find companies" search
// against an optional budget cap, so a runaway loop of searches can't
// rack up an unbounded bill unnoticed. Low-traffic, two-person-studio
// scale — the read-then-write below isn't atomic, but the worst case
// from two searches landing in the same instant is underscore-level
// drift in a number nobody's relying on to the token, not a real bug.
function supabaseUrl(): string | undefined {
  return process.env.VITE_SUPABASE_URL
}

function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // 'YYYY-MM'
}

export async function getTokensUsedThisMonth(): Promise<number> {
  const url = supabaseUrl()
  const key = serviceKey()
  if (!url || !key) return 0

  const res = await fetch(`${url}/rest/v1/ai_usage_monthly?month=eq.${currentMonth()}&select=tokens_used`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  })
  if (!res.ok) return 0
  const rows = (await res.json()) as { tokens_used: number }[]
  return rows[0]?.tokens_used ?? 0
}

export async function addTokensUsed(tokens: number): Promise<number> {
  const url = supabaseUrl()
  const key = serviceKey()
  if (!url || !key) return tokens

  const current = await getTokensUsedThisMonth()
  const next = current + tokens
  await fetch(`${url}/rest/v1/ai_usage_monthly?on_conflict=month`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ month: currentMonth(), tokens_used: next }),
  })
  return next
}

// null means no cap configured — usage is still tracked either way.
export function monthlyTokenBudget(): number | null {
  const raw = process.env.ACQUISITION_MONTHLY_TOKEN_BUDGET
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}
