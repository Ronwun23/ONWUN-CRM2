import { supabase } from '@/lib/supabase'
import type { StrategyDraft } from '@/types'

// Calls the Vercel serverless function at /api/generate-strategy — the
// actual Anthropic call happens server-side, since the API key can't
// safely live in client code. The endpoint verifies the caller is a
// signed-in agency account itself, but the session token is still sent
// along so it has something to check.
export async function generateStrategyDraft(answers: Record<string, string>, transcript: string): Promise<StrategyDraft> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/generate-strategy', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ answers, transcript }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? `Failed to generate strategy (${res.status})`)
  }

  const draft = (await res.json()) as Omit<StrategyDraft, 'status' | 'generatedAt' | 'transcriptUsed'>
  return {
    ...draft,
    status: 'ai_draft',
    generatedAt: new Date().toISOString(),
    transcriptUsed: transcript.trim(),
  }
}
