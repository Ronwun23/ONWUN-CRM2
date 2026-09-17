import { useState } from 'react'
import { Mail, Phone, Building2, Tag, Calendar, MessageSquarePlus } from 'lucide-react'
import type { Lead, Stage } from '@/types'
import { STAGES, STAGE_LABELS } from '@/types'
import { useCrm } from '@/context/CrmContext'
import { OwnerAvatar, ownerName } from '@/components/Avatar'
import StageBadge from '@/components/StageBadge'
import PriorityBadge from '@/components/PriorityBadge'
import { formatFullCurrency, formatDate, formatRelativeDate } from '@/lib/format'

export default function LeadDetailPanel({ lead }: { lead: Lead }) {
  const { updateLeadStage, addActivity } = useCrm()
  const [note, setNote] = useState('')

  const activities = [...lead.activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleAddNote = () => {
    if (!note.trim()) return
    addActivity(lead.id, {
      id: `act-${Date.now()}`,
      type: 'note',
      text: note.trim(),
      date: new Date().toISOString(),
    })
    setNote('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-ink-primary">{lead.name}</h3>
        <p className="text-sm text-ink-secondary">
          {lead.title} at {lead.company}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <StageBadge stage={lead.stage} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-black/[0.06] bg-surface-sunken/60 p-3.5 text-sm">
        <InfoRow icon={Building2} label="Company" value={lead.company} />
        <InfoRow icon={Mail} label="Email" value={lead.email} />
        <InfoRow icon={Phone} label="Phone" value={lead.phone} />
        <InfoRow icon={Tag} label="Source" value={lead.source} />
        <InfoRow icon={Calendar} label="Created" value={formatDate(lead.createdAt)} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-black/[0.06] p-3.5">
        <div>
          <p className="text-xs text-ink-muted">Deal value</p>
          <p className="text-lg font-semibold tabular-nums">{formatFullCurrency(lead.value)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OwnerAvatar ownerId={lead.owner} size={28} />
          <span className="text-sm text-ink-secondary">{ownerName(lead.owner)}</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Move stage
        </label>
        <select
          value={lead.stage}
          onChange={(e) => updateLeadStage(lead.id, e.target.value as Stage)}
          className="w-full rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm text-ink-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Add a note</p>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            placeholder="Log a call, email, or update…"
            className="flex-1 rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={handleAddNote}
            className="flex items-center justify-center rounded-lg bg-brand-500 px-3 text-white hover:bg-brand-600"
            aria-label="Add note"
          >
            <MessageSquarePlus size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Activity</p>
        <ul className="flex flex-col gap-3">
          {activities.length === 0 && <p className="text-sm text-ink-muted">No activity yet.</p>}
          {activities.map((a) => (
            <li key={a.id} className="border-l-2 border-black/[0.08] pl-3">
              <p className="text-sm text-ink-primary">{a.text}</p>
              <p className="text-xs text-ink-muted">{formatRelativeDate(a.date)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="shrink-0 text-ink-muted" />
      <span className="w-16 shrink-0 text-xs text-ink-muted">{label}</span>
      <span className="truncate text-ink-primary">{value}</span>
    </div>
  )
}
