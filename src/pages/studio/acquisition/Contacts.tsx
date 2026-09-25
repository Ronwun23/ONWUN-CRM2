import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { STUDIO_ACCOUNTS } from '@/data/team'
import Drawer from '@/components/Drawer'
import Pill from '@/components/Pill'
import { Select } from '@/components/ui/select'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { LEAD_STATUS_TONE } from '@/lib/labels'
import { LEAD_STATUS_LABEL } from '@/lib/leadOutcomes'
import { formatRelativeDate } from '@/lib/format'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function AcquisitionContacts() {
  const { leads, addLead, activeAccount } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [platform, setPlatform] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [country, setCountry] = useState('')
  const [noticedNote, setNoticedNote] = useState('')
  const [owner, setOwner] = useState(activeAccount.id)
  const [saving, setSaving] = useState(false)

  const sorted = [...leads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const resetForm = () => {
    setCompanyName('')
    setWebsite('')
    setPlatform('')
    setContactName('')
    setContactEmail('')
    setCountry('')
    setNoticedNote('')
    setOwner(activeAccount.id)
  }

  const handleAdd = async () => {
    if (!companyName.trim()) return
    setSaving(true)
    try {
      await addLead({
        companyName: companyName.trim(),
        website: website.trim() || undefined,
        platform: platform.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        country: country.trim() || undefined,
        noticedNote: noticedNote.trim() || undefined,
        owner,
      })
      resetForm()
      setShowAdd(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Contacts</h1>
          <p className="text-sm text-ink-secondary">Every lead in the outreach pipeline</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          Add lead
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">No leads yet — add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((lead) => (
            <Link
              key={lead.id}
              to={`/acquisition/contacts/${lead.id}`}
              className="flex flex-col gap-2.5 rounded-xl border border-black/[0.06] bg-white p-4 shadow-card hover:border-brand-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-primary">{lead.companyName}</p>
                  {lead.website && <p className="truncate text-xs text-ink-muted">{lead.website}</p>}
                </div>
                <MemberAvatar memberId={lead.owner} size={22} />
              </div>
              {(lead.contactName || lead.contactEmail) && (
                <p className="truncate text-xs text-ink-secondary">
                  {[lead.contactName, lead.contactEmail].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-1">
                <Pill tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Pill>
                <span className="text-[11px] text-ink-muted">{formatRelativeDate(lead.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add lead">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Company name</label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
              autoFocus
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              className={inputClass}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Platform</label>
              <input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Shopify"
                className={inputClass}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Contact name</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className={labelClass}>Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputClass}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className={labelClass}>What you noticed</label>
            <textarea
              value={noticedNote}
              onChange={(e) => setNoticedNote(e.target.value)}
              rows={3}
              placeholder="A genuine observation about their brand or website…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Owner</label>
            <Select
              value={owner}
              onChange={setOwner}
              options={STUDIO_ACCOUNTS.map((a) => ({ value: a.id, label: memberName(a.id) }))}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!companyName.trim() || saving}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Adding…' : 'Add lead'}
          </button>
        </div>
      </Drawer>
    </div>
  )
}
