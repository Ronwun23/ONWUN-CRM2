import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Mail, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import Drawer from '@/components/Drawer'
import Pill from '@/components/Pill'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { confirmAction } from '@/lib/confirm'
import { formatDate } from '@/lib/format'
import { LEAD_STATUS_TONE } from '@/lib/labels'
import { draftOutreachEmail } from '@/lib/api/outreachEmail'
import {
  LEAD_STATUS_LABEL,
  SEQUENCE_STEP_LABEL,
  TOUCH_KIND_LABEL,
  canAskAQuestion,
  canConvertToClient,
  isLive,
  nextEscalation,
} from '@/lib/leadOutcomes'
import type { LeadStatus } from '@/types'

const PROJECT_TYPES = ['Brand Identity', 'Website', 'Social Media Management', 'CRM']

export default function AcquisitionContactDetail() {
  const { leadId } = useParams<{ leadId: string }>()
  const navigate = useNavigate()
  const { leads, acquisitionProfile, markLeadDoneSentIt, setLeadOutcome, convertLeadToClient } = useApp()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  // The AI draft's shared body and its 4 opening lines, kept separately
  // from the editable `body` above so "try another opening" can always
  // rebuild cleanly — see cycleOpening.
  const [aiBody, setAiBody] = useState('')
  const [openings, setOpenings] = useState<string[]>([])
  const [openingIndex, setOpeningIndex] = useState(0)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [projectName, setProjectName] = useState(PROJECT_TYPES[0])
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)
  const [converting, setConverting] = useState(false)

  const lead = leads.find((l) => l.id === leadId)
  if (!lead) return <Navigate to="/acquisition/contacts" replace />

  // Onwun's mail is hosted on Microsoft 365, on the newer unified
  // outlook.cloud.microsoft web app (not the older outlook.office.com,
  // which redirects here anyway and drops the compose query params in
  // the process) — same deep-link shape, just the current domain.
  const outlookUrl = `https://outlook.cloud.microsoft/mail/deeplink/compose?to=${encodeURIComponent(
    lead.contactEmail ?? ''
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const handleDoneSentIt = async () => {
    setSending(true)
    try {
      await markLeadDoneSentIt(lead.id)
    } finally {
      setSending(false)
    }
  }

  const handleDraft = async () => {
    setDrafting(true)
    setDraftError(null)
    try {
      const draft = await draftOutreachEmail({
        companyName: lead.companyName,
        contactName: lead.contactName,
        noticedNote: lead.noticedNote,
        whyFits: lead.whyFits,
      })
      setSubject(draft.subject)
      setOpenings(draft.openings)
      setAiBody(draft.body)
      setOpeningIndex(0)
      setBody(`${draft.openings[0]}\n\n${draft.body}`)
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Could not draft the email.')
    } finally {
      setDrafting(false)
    }
  }

  const cycleOpening = () => {
    if (openings.length === 0) return
    const next = (openingIndex + 1) % openings.length
    setOpeningIndex(next)
    setBody(`${openings[next]}\n\n${aiBody}`)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(body).catch(() => {})
  }

  const handleOutcome = async (outcome: LeadStatus) => {
    if (outcome === 'suppressed') {
      const confirmed = await confirmAction(`Remove "${lead.companyName}" and never contact them again?`, {
        confirmLabel: 'Remove',
        destructive: true,
      })
      if (!confirmed) return
    }
    await setLeadOutcome(lead.id, outcome)
  }

  const handleConvert = async () => {
    if (!dueDate) return
    setConverting(true)
    try {
      const client = await convertLeadToClient(lead.id, { projectName, dueDate })
      navigate(`/clients/${client.id}/dashboard`)
    } finally {
      setConverting(false)
    }
  }

  const escalation = nextEscalation(lead.status)
  const live = isLive(lead.status)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/acquisition/contacts"
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={13} />
        Contacts
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">{lead.companyName}</h1>
          {lead.website && (
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              {lead.website}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Pill>
          <MemberAvatar memberId={lead.owner} size={28} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="Contact">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Name</p>
                <p className="mt-0.5 text-ink-primary">{lead.contactName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Email</p>
                <p className="mt-0.5 truncate text-ink-primary">{lead.contactEmail || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Mobile</p>
                <p className="mt-0.5 text-ink-primary">{lead.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Country</p>
                <p className="mt-0.5 text-ink-primary">{lead.country || '—'}</p>
              </div>
            </div>
            {lead.noticedNote && (
              <div className="mt-3 border-t border-black/[0.06] pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">What you noticed</p>
                <p className="mt-1 text-sm text-ink-secondary">{lead.noticedNote}</p>
              </div>
            )}
          </Card>

          {live && (
            <Card title="Email" subtitle="Drafted from your Setup brief and what you noticed — edit freely before sending.">
              <div className="flex flex-col gap-3">
                {!acquisitionProfile && (
                  <p className="text-xs text-status-warning">
                    <Link to="/acquisition/setup" className="underline">
                      Fill in Setup
                    </Link>{' '}
                    to draft with AI — you can still write the email manually below.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDraft}
                    disabled={drafting || !acquisitionProfile}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-500 px-3.5 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles size={14} />
                    {drafting ? 'Drafting…' : openings.length > 0 ? 'Draft again' : 'Draft with AI'}
                  </button>
                  {openings.length > 0 && (
                    <button
                      onClick={cycleOpening}
                      className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-ink-primary hover:bg-surface-sunken"
                    >
                      <RefreshCw size={14} />
                      Try another opening, {openingIndex + 1} of {openings.length}
                    </button>
                  )}
                </div>
                {draftError && <p className="text-xs text-status-critical">{draftError}</p>}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  autoComplete="off"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write the email…"
                  className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!body}
                    className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-semibold text-ink-primary hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                  <a
                    href={outlookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-semibold text-ink-primary hover:bg-surface-sunken"
                  >
                    <Mail size={14} />
                    Open in Outlook
                  </a>
                  <button
                    onClick={handleDoneSentIt}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={14} />
                    {sending ? 'Saving…' : 'Done, sent it'}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {live && (
            <Card title="What's next">
              <div className="flex flex-wrap items-center gap-2">
                {escalation && (
                  <button
                    onClick={() => handleOutcome(escalation.outcome)}
                    className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    {escalation.label}
                  </button>
                )}
                {canAskAQuestion(lead.status) && (
                  <button
                    onClick={() => handleOutcome('live_conversation')}
                    className="rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-ink-primary hover:bg-surface-sunken"
                  >
                    Asked a question
                  </button>
                )}
                <button
                  onClick={() => handleOutcome('not_now')}
                  className="rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
                >
                  Not now
                </button>
                <button
                  onClick={() => handleOutcome('suppressed')}
                  className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-status-critical hover:bg-[#fbecec]"
                >
                  <Trash2 size={13} />
                  Remove me, never contact
                </button>
              </div>
              {canConvertToClient(lead.status) && (
                <button
                  onClick={() => setShowConvert(true)}
                  className="mt-3 w-full rounded-lg bg-status-good/90 px-3.5 py-2 text-sm font-semibold text-white hover:bg-status-good"
                >
                  Convert to client
                </button>
              )}
            </Card>
          )}
        </div>

        <Card title="What happens next">
          {lead.steps.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nothing scheduled yet — click "Done, sent it" once the first email goes out to start the sequence.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/[0.05]">
              {lead.steps.map((step) => (
                <li key={step.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={
                      step.done
                        ? 'flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white'
                        : 'h-4 w-4 shrink-0 rounded-full border border-black/20'
                    }
                  >
                    {step.done && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span
                    className={
                      step.done ? 'flex-1 text-sm text-ink-muted line-through' : 'flex-1 text-sm text-ink-primary'
                    }
                  >
                    {SEQUENCE_STEP_LABEL[step.stepType]}
                  </span>
                  <span className="text-xs text-ink-muted">{formatDate(step.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}

          {lead.touches.length > 0 && (
            <div className="mt-4 border-t border-black/[0.06] pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">History</p>
              <ul className="flex flex-col gap-1.5">
                {lead.touches.map((touch) => (
                  <li key={touch.id} className="text-xs text-ink-secondary">
                    <span className="text-ink-muted">{formatDate(touch.createdAt)}</span> —{' '}
                    {touch.note || TOUCH_KIND_LABEL[touch.kind]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <Drawer open={showConvert} onClose={() => setShowConvert(false)} title="Convert to client">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Project</label>
            <Select
              value={projectName}
              onChange={setProjectName}
              options={PROJECT_TYPES.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Due date</label>
            <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select date" />
          </div>
          <p className="text-xs text-ink-muted">
            Owner will be {memberName(lead.owner)}. What you noticed will carry over as the client's first update.
          </p>
          <button
            onClick={handleConvert}
            disabled={!dueDate || converting}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {converting ? 'Converting…' : 'Convert to client'}
          </button>
        </div>
      </Drawer>
    </div>
  )
}
