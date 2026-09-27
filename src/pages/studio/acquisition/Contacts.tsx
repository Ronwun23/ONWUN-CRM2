import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, ChevronRight, Search, UserPlus, Users } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { STUDIO_ACCOUNTS } from '@/data/team'
import Modal from '@/components/Modal'
import { Select } from '@/components/ui/select'
import { memberName } from '@/components/Avatar'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function AcquisitionContacts() {
  const { leads, addLead, activeAccount } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [country, setCountry] = useState('')
  const [noticedNote, setNoticedNote] = useState('')
  const [owner, setOwner] = useState(activeAccount.id)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [justAdded, setJustAdded] = useState(false)

  const resetForm = () => {
    setCompanyName('')
    setWebsite('')
    setPhone('')
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
        phone: phone.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        country: country.trim() || undefined,
        noticedNote: noticedNote.trim() || undefined,
        owner,
      })
      resetForm()
      setShowAdd(false)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? leads.filter((l) =>
          [l.contactName, l.companyName, l.contactEmail].some((v) => v?.toLowerCase().includes(q))
        )
      : leads
    return [...list].sort((a, b) => {
      const an = (a.contactName || a.companyName).toLowerCase()
      const bn = (b.contactName || b.companyName).toLowerCase()
      return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an)
    })
  }, [leads, search, sortDir])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Contacts</h1>
          <p className="text-sm text-ink-secondary">
            {leads.length} contact{leads.length === 1 ? '' : 's'}.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-full border-2 border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          <UserPlus size={16} />
          New contact
        </button>
      </div>

      <hr className="border-black/[0.06]" />

      {justAdded && <p className="-mt-1 text-sm font-medium text-brand-600">Contact added.</p>}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or email"
            className="w-full rounded-lg border border-black/[0.10] py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoComplete="off"
          />
        </div>
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
        >
          <ArrowUpDown size={14} />
          Name
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {leads.length === 0 ? 'No contacts yet — add one to get started.' : 'No contacts match your search.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
          {filtered.map((lead, i) => (
            <Link
              key={lead.id}
              to={`/acquisition/contacts/${lead.id}`}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 hover:bg-surface-sunken/60',
                i > 0 && 'border-t border-black/[0.05]'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-secondary">
                <Users size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-primary">{lead.contactName || lead.companyName}</p>
                <p className="truncate text-xs text-ink-muted">
                  {[lead.companyName, lead.contactEmail].filter(Boolean).join(' · ')}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New contact"
        subtitle="Add a new person to your contacts."
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
              autoFocus
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Company</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
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
              <label className={labelClass}>Mobile</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className={labelClass}>Owner</label>
              <Select
                value={owner}
                onChange={setOwner}
                options={STUDIO_ACCOUNTS.map((a) => ({ value: a.id, label: memberName(a.id) }))}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={noticedNote}
              onChange={(e) => setNoticedNote(e.target.value)}
              rows={2}
              placeholder="A genuine observation about their brand or website…"
              className={inputClass}
            />
          </div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!companyName.trim() || saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Adding…' : 'Add contact'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
