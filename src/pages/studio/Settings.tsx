import { useState } from 'react'
import { Calendar, CalendarClock, Check, Copy, MessageSquare, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Slack/Google Calendar/Calendly aren't wired to anything real yet — every
// button there is a deliberate dead end, not a silent no-op. Claude is
// real: paste the URL into Claude's own connector settings to connect
// your own account — see api/mcp.ts and api/_mcp/store.ts.
interface Connector {
  id: string
  name: string
  description: string
  icon: LucideIcon
}

const STUDIO_CONNECTORS: Connector[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post client updates and mentions straight to a channel.',
    icon: MessageSquare,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync studio and client events both ways.',
    icon: Calendar,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Pull booked meetings into the studio calendar automatically.',
    icon: CalendarClock,
  },
]

function ClaudeConnectorRow() {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/api/mcp`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the
      // URL is still selectable text below, so nothing is actually lost.
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
          <Sparkles size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-primary">Claude</p>
          <p className="text-xs text-ink-muted">Read, summarize and look things up across the studio — as you, nothing shared between accounts.</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-surface-sunken"
        >
          {copied ? <Check size={12} className="text-status-good" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy server URL'}
        </button>
      </div>
      <p className="mt-3 border-t border-black/[0.06] pt-3 text-xs text-ink-muted">
        In Claude, go to Settings → Connectors → Add custom connector, and paste in this URL. You'll be asked to sign in
        with your Onwun account the same way you do here.
      </p>
    </div>
  )
}

function ConnectorRow({ connector }: { connector: Connector }) {
  const Icon = connector.icon
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-white px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-primary">{connector.name}</p>
          <p className="truncate text-xs text-ink-muted">{connector.description}</p>
        </div>
      </div>
      <button
        disabled
        title="Coming soon"
        className="shrink-0 cursor-not-allowed rounded-lg border border-black/[0.08] bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink-muted"
      >
        Coming soon
      </button>
    </div>
  )
}

export default function StudioSettings() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Settings</h1>
        <p className="text-sm text-ink-secondary">Connect the studio to the tools your team already uses.</p>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">MCP</p>
        <p className="mb-3 text-sm text-ink-secondary">
          Let an AI assistant read the studio directly, on your behalf — never shared between accounts.
        </p>
        <div className="flex flex-col gap-2">
          <ClaudeConnectorRow />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Studio</p>
        <p className="mb-3 text-sm text-ink-secondary">What the studio connects to, for everyone on it.</p>
        <div className="flex flex-col gap-2">
          {STUDIO_CONNECTORS.map((c) => (
            <ConnectorRow key={c.id} connector={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
