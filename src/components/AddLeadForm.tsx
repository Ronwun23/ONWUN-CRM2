import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Lead, Priority, Source } from '@/types'
import { STAGES, STAGE_LABELS } from '@/types'
import { OWNERS } from '@/data/owners'
import { useCrm } from '@/context/CrmContext'

const SOURCE_OPTIONS: Source[] = [
  'Referral', 'Website', 'Cold Outreach', 'Event', 'Partner', 'Social Media', 'Inbound Call',
]

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function AddLeadForm({ onDone }: { onDone: () => void }) {
  const { addLead } = useCrm()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [value, setValue] = useState('10000')
  const [source, setSource] = useState<Source>('Website')
  const [owner, setOwner] = useState(OWNERS[0].id)
  const [stage, setStage] = useState<Lead['stage']>('new')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !company.trim()) return

    const numericValue = Number(value) || 0
    const priority: Priority = numericValue > 80000 ? 'high' : numericValue > 30000 ? 'medium' : 'low'
    const now = new Date().toISOString()

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      title: title.trim() || 'Contact',
      email: email.trim() || `${name.trim().split(' ')[0].toLowerCase()}@${company.trim().split(' ')[0].toLowerCase()}.com`,
      phone: phone.trim() || '(000) 000-0000',
      industry: 'Other',
      source,
      stage,
      value: numericValue,
      owner,
      priority,
      createdAt: now,
      lastActivityAt: now,
      activities: [{ id: `act-${Date.now()}`, type: 'note', text: 'Lead created.', date: now }],
    }

    addLead(lead)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Contact name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Company</label>
        <input required value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Deal value ($)</label>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value as Source)} className={inputClass}>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Owner</label>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass}>
            {OWNERS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value as Lead['stage'])} className={inputClass}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Add lead
      </button>
    </form>
  )
}
