import { supabase } from '@/lib/supabase'

export interface OutreachDraft {
  subject: string
  // Exactly 4 alternative opening lines — the rest of the email (body)
  // is shared and written to follow any of them.
  openings: string[]
  body: string
}

// Calls the Vercel serverless function at /api/draft-outreach-email —
// same pattern as generateStrategyDraft: the actual Anthropic call
// happens server-side, only the caller's session token travels with it
// so the endpoint can verify they're a signed-in agency account.
export async function draftOutreachEmail(input: {
  companyName: string
  contactName?: string
  noticedNote?: string
  whyFits?: string
}): Promise<OutreachDraft> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/draft-outreach-email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? `Failed to draft the email (${res.status})`)
  }

  return (await res.json()) as OutreachDraft
}
