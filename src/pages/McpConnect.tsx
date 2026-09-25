import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Login from '@/pages/Login'
import Spinner from '@/components/Spinner'

// Where Claude's "Connect" button actually lands, mid-OAuth-handshake —
// reuses the app's own magic-link login instead of a second login form,
// then hands the resulting Supabase session off to
// /api/mcp-complete-authorize to finish the connection. See
// api/_mcp/store.ts (the authorize() function that redirects here) for
// the other half of this flow.
export default function McpConnect() {
  const { session, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const req = searchParams.get('req')
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!session || !req || completed) return
    setCompleted(true)
    ;(async () => {
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession()
      if (!freshSession) {
        setError('Your session expired — refresh and try again.')
        setCompleted(false)
        return
      }
      try {
        const res = await fetch('/api/mcp-complete-authorize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            req,
            supabaseAccessToken: freshSession.access_token,
            supabaseRefreshToken: freshSession.refresh_token,
          }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? 'Could not complete the connection')
        window.location.href = body.redirectTo
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't connect — try again.")
        setCompleted(false)
      }
    })()
  }, [session, req, completed])

  if (!req) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 text-center text-sm text-ink-muted">
        This link is missing what it needs to connect Claude — try again from Claude's connector settings.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-surface-page text-sm text-ink-muted">
        <Spinner />
        Loading…
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/[0.06] bg-white p-6 text-center shadow-card">
        <h1 className="text-lg font-semibold text-ink-primary">Connecting Claude</h1>
        {error ? (
          <>
            <p className="mt-1.5 text-sm text-status-critical">{error}</p>
            <button
              onClick={() => setCompleted(false)}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Try again
            </button>
          </>
        ) : (
          <p className="mt-1.5 flex items-center justify-center gap-2 text-sm text-ink-secondary">
            <Spinner />
            Finishing setup…
          </p>
        )}
      </div>
    </div>
  )
}
