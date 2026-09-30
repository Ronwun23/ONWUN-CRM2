import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import onwunWordmark from '@/assets/onwun-wordmark.png'

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
    <div className="login-backdrop flex min-h-screen items-center justify-center px-4">
      <div className="border-beam glass-panel w-full max-w-sm rounded-xl p-6">
        <img src={onwunWordmark} alt="Onwun" className="mx-auto h-7 w-auto" />
        {sent && <p className="mt-3 text-center text-sm text-ink-secondary">Check your email for a sign-in link.</p>}
        {!sent && (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
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
