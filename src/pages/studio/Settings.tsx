import { Calendar, CalendarClock, MessageSquare, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Not wired to anything real yet — this is the shape of the page before
// the actual MCP server and OAuth connectors get built behind it. Every
// button is a deliberate dead end for now rather than a silent no-op.
interface Connector {
  id: string
  name: string
  description: string
  icon: LucideIcon
}

const MCP_CONNECTORS: Connector[] = [
  {
    id: 'claude',
    name: 'Claude',
    description: 'Read, summarize and make changes across the studio — clients, tasks, calendar, documents.',
    icon: Sparkles,
  },
]

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
          {MCP_CONNECTORS.map((c) => (
            <ConnectorRow key={c.id} connector={c} />
          ))}
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
