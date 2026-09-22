import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { signInWithEmail, linkError } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (linkError) setError(linkError)
  }, [linkError])
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    const { error } = await signInWithEmail(email.trim())
    setSending(false)
    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/[0.06] bg-white p-6 shadow-card">
        <h1 className="text-lg font-semibold text-ink-primary">Onwun Studio</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {sent ? 'Check your email for a sign-in link.' : 'Sign in with your email — no password needed.'}
        </p>
        {!sent && (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@onwun.com"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="email"
            />
            {error && <p className="text-xs text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
