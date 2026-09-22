import { useState } from 'react'
import { Check, Copy, Send, UserPlus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { inviteClientUser } from '@/lib/api/auth'
import Drawer from '@/components/Drawer'
import type { Client } from '@/types'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function InviteClientDrawer({
  client,
  open,
  onClose,
}: {
  client: Client
  open: boolean
  onClose: () => void
}) {
  const { addUpdate, activeAccount } = useApp()
  const [emails, setEmails] = useState<string[]>([client.email ?? ''])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const portalLink = `${window.location.origin}/clients/${client.id}/dashboard`

  const handleEmailChange = (index: number, value: string) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)))
  }

  const handleAddEmail = () => setEmails((prev) => [...prev, ''])

  const handleSend = async () => {
    const validEmails = emails.map((e) => e.trim()).filter(Boolean)
    if (validEmails.length === 0) return
    setSending(true)
    setError(null)
    const results = await Promise.all(validEmails.map((email) => inviteClientUser(email, client)))
    const firstError = results.find((r) => r.error)?.error
    setSending(false)
    if (firstError) {
      setError(firstError)
      return
    }
    addUpdate(client.id, {
      id: `update-${Date.now()}`,
      text: `Invited ${validEmails.join(', ')} to the client portal`,
      date: new Date().toISOString(),
      author: activeAccount.name,
      authorType: 'agency',
    })
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setEmails([client.email ?? ''])
      onClose()
    }, 1200)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Drawer open={open} onClose={onClose} title="Invite client">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.10]">
            <UserPlus className="text-ink-secondary" size={18} />
          </div>
          <p className="text-sm text-ink-secondary">
            Give {client.name} access to their portal — to track progress, see documents, and leave comments.
          </p>
        </div>

        <div>
          <label className={labelClass}>Invite via email</label>
          <div className="flex flex-col gap-2">
            {emails.map((email, index) => (
              <input
                key={index}
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="client@company.com"
                className={inputClass}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddEmail}
            className="mt-2 text-xs font-medium text-brand-600 hover:underline"
          >
            + Add another
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={sent || sending || emails.every((e) => !e.trim())}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sent ? (
            <>
              <Check size={14} />
              Invite sent
            </>
          ) : sending ? (
            'Sending…'
          ) : (
            <>
              <Send size={14} />
              Send invite
            </>
          )}
        </button>
        {error && <p className="-mt-2 text-xs text-status-critical">{error}</p>}

        <hr className="border-black/[0.06]" />

        <div>
          <label className={labelClass}>Portal link</label>
          <p className="mb-1.5 -mt-1 text-xs text-ink-muted">
            Only works once they've signed in via an emailed invite above — share it as a bookmark, not as the way in.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={portalLink} className={`${inputClass} text-ink-muted`} />
            <button
              onClick={handleCopyLink}
              aria-label={copied ? 'Copied' : 'Copy link'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.10] text-ink-secondary hover:bg-surface-sunken"
            >
              {copied ? <Check size={14} className="text-brand-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
