import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { GitBranch, Trash2, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import Pill from '@/components/Pill'
import { Select } from '@/components/ui/select'
import { confirmAction } from '@/lib/confirm'
import { formatFullCurrency, formatRelativeDate, initials } from '@/lib/format'
import type { Deal, DealPriority, DealStage, Lead } from '@/types'

const STAGES: { key: DealStage; label: string; accent: string }[] = [
  { key: 'new', label: 'New', accent: '#9ca3af' },
  { key: 'contacted', label: 'Contacted', accent: '#3b82f6' },
  { key: 'qualified', label: 'Qualified', accent: '#a855f7' },
  { key: 'proposal', label: 'Proposal', accent: '#eab308' },
  { key: 'won', label: 'Won', accent: '#22c55e' },
  { key: 'lost', label: 'Lost', accent: '#ef4444' },
]

const PRIORITIES: { key: DealPriority; label: string }[] = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

const PRIORITY_TONE: Record<DealPriority, 'critical' | 'warning' | 'neutral'> = {
  high: 'critical',
  medium: 'warning',
  low: 'neutral',
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'EUR', label: 'EUR' },
]

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-medium',
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-black/[0.10] bg-white text-ink-secondary hover:bg-surface-sunken'
      )}
    >
      {label}
    </button>
  )
}

function ContactSearch({
  leads,
  selected,
  onSelect,
  onClear,
}: {
  leads: Lead[]
  selected: { id: string; name: string } | null
  onSelect: (lead: Lead) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return leads
      .filter((l) => [l.contactName, l.companyName, l.contactEmail].some((v) => v?.toLowerCase().includes(q)))
      .slice(0, 6)
  }, [leads, query])

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.10] bg-surface-sunken px-3 py-2 text-sm">
        <span className="truncate font-medium text-ink-primary">{selected.name}</span>
        <button onClick={onClear} className="shrink-0 text-xs font-medium text-ink-muted hover:text-ink-primary">
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search contacts by name, email, or company"
        className={inputClass}
        autoComplete="off"
      />
      {matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-pop">
          {matches.map((lead) => (
            <button
              key={lead.id}
              onClick={() => {
                onSelect(lead)
                setQuery('')
              }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-sunken"
            >
              <span className="font-medium text-ink-primary">{lead.contactName || lead.companyName}</span>
              {lead.companyName && lead.contactName && (
                <span className="text-xs text-ink-muted">{lead.companyName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DealCard({
  deal,
  onDragStart,
  onRemove,
}: {
  deal: Deal
  onDragStart: (e: DragEvent<HTMLDivElement>, dealId: string) => void
  onRemove: (dealId: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group cursor-grab rounded-xl border border-black/[0.06] bg-white p-3 shadow-card active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-primary">{deal.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Pill tone={PRIORITY_TONE[deal.priority]}>{deal.priority.toUpperCase()}</Pill>
          <button
            onClick={() => onRemove(deal.id)}
            className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted hover:text-status-critical"
            aria-label="Remove deal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {deal.value != null && (
        <p className="mt-1 text-sm font-medium text-ink-primary">{formatFullCurrency(deal.value, deal.currency)}</p>
      )}
      <p className="mt-1 text-xs text-ink-muted">{formatRelativeDate(deal.createdAt)}</p>
      {deal.contactName && (
        <div className="mt-2 flex items-center gap-2 border-t border-black/[0.06] pt-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[10px] font-semibold text-ink-secondary">
            {initials(deal.contactName)}
          </div>
          <p className="truncate text-xs text-ink-secondary">{deal.contactName}</p>
        </div>
      )}
    </div>
  )
}

export default function AcquisitionPipeline() {
  const { deals, leads, addDeal, updateDealStage, removeDeal } = useApp()
  const [showNewDeal, setShowNewDeal] = useState(false)

  const [stageFilter, setStageFilter] = useState<Set<DealStage>>(new Set())
  const [priorityFilter, setPriorityFilter] = useState<Set<DealPriority>>(new Set())
  const [valueMin, setValueMin] = useState('')
  const [valueMax, setValueMax] = useState('')
  const [country, setCountry] = useState('all')

  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [stage, setStage] = useState<DealStage>('new')
  const [priority, setPriority] = useState<DealPriority>('medium')
  const [contact, setContact] = useState<{ id: string; name: string; country?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const countries = useMemo(() => {
    const set = new Set(deals.map((d) => d.contactCountry).filter((c): c is string => !!c))
    return Array.from(set).sort()
  }, [deals])

  const toggleStage = (key: DealStage) => {
    setStageFilter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const togglePriority = (key: DealPriority) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filteredDeals = useMemo(() => {
    const min = valueMin.trim() ? Number(valueMin) : undefined
    const max = valueMax.trim() ? Number(valueMax) : undefined
    return deals.filter((d) => {
      if (stageFilter.size > 0 && !stageFilter.has(d.stage)) return false
      if (priorityFilter.size > 0 && !priorityFilter.has(d.priority)) return false
      if (min != null && (d.value ?? 0) < min) return false
      if (max != null && (d.value ?? 0) > max) return false
      if (country !== 'all' && d.contactCountry !== country) return false
      return true
    })
  }, [deals, stageFilter, priorityFilter, valueMin, valueMax, country])

  const dealsByStage = useMemo(() => {
    const map = new Map<DealStage, Deal[]>()
    for (const s of STAGES) map.set(s.key, [])
    for (const deal of filteredDeals) map.get(deal.stage)?.push(deal)
    return map
  }, [filteredDeals])

  const openDeals = filteredDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const openValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const wonValue = filteredDeals.filter((d) => d.stage === 'won').reduce((sum, d) => sum + (d.value ?? 0), 0)

  const resetForm = () => {
    setTitle('')
    setValue('')
    setCurrency('USD')
    setStage('new')
    setPriority('medium')
    setContact(null)
  }

  const handleCreate = async () => {
    if (!title.trim() || !contact) return
    setSaving(true)
    setCreateError(null)
    try {
      await addDeal({
        title: title.trim(),
        value: value.trim() ? Number(value) : undefined,
        currency,
        stage,
        priority,
        contactId: contact.id,
        contactName: contact.name,
        contactCountry: contact.country,
      })
      resetForm()
      setShowNewDeal(false)
    } catch (err) {
      console.error('Failed to save deal to Supabase:', err)
      setCreateError("Couldn't save this deal — try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStage: DealStage) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/plain')
    if (dealId) updateDealStage(dealId, targetStage)
  }

  const handleRemove = async (dealId: string) => {
    const confirmed = await confirmAction('Remove this deal? This can\'t be undone.', {
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (!confirmed) return
    removeDeal(dealId)
  }

  const newDealDrawer = (
    <Drawer open={showNewDeal} onClose={() => setShowNewDeal(false)} title="New Deal">
      <p className="-mt-2 mb-4 text-sm text-ink-secondary">Track an opportunity against a contact. Deals live in your pipeline.</p>
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelClass}>Deal title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} autoFocus autoComplete="off" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <Select
            value={stage}
            onChange={(v) => setStage(v as DealStage)}
            options={STAGES.map((s) => ({ value: s.key, label: s.label }))}
          />
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <Select
            value={priority}
            onChange={(v) => setPriority(v as DealPriority)}
            options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))}
          />
        </div>
        <div>
          <label className={labelClass}>Contact *</label>
          <ContactSearch
            leads={leads}
            selected={contact ? { id: contact.id, name: contact.name } : null}
            onSelect={(lead) =>
              setContact({ id: lead.id, name: lead.contactName || lead.companyName, country: lead.country })
            }
            onClear={() => setContact(null)}
          />
        </div>
        {createError && <p className="text-xs text-status-critical">{createError}</p>}
        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowNewDeal(false)}
            className="rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !contact || saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create Deal'}
          </button>
        </div>
      </div>
    </Drawer>
  )

  if (deals.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">Pipeline</h1>
          </div>
          <button
            onClick={() => setShowNewDeal(true)}
            className="flex items-center gap-1.5 rounded-full border-2 border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            <UserPlus size={16} />
            New Deal
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-16 text-center shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-ink-secondary">
            <GitBranch size={18} />
          </div>
          <p className="text-base font-semibold text-ink-primary">No deals yet</p>
          <p className="text-sm text-ink-secondary">Create your first deal to start tracking opportunities.</p>
          <button
            onClick={() => setShowNewDeal(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <UserPlus size={15} />
            New Deal
          </button>
        </div>
        {newDealDrawer}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Pipeline</h1>
        </div>
        <button
          onClick={() => setShowNewDeal(true)}
          className="flex items-center gap-1.5 rounded-full border-2 border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          <UserPlus size={16} />
          New Deal
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Filters</span>
        <span className="text-xs text-ink-muted">Stage:</span>
        {STAGES.map((s) => (
          <FilterPill key={s.key} label={s.label} active={stageFilter.has(s.key)} onClick={() => toggleStage(s.key)} />
        ))}
        <span className="ml-2 text-xs text-ink-muted">Priority:</span>
        {PRIORITIES.map((p) => (
          <FilterPill key={p.key} label={p.label} active={priorityFilter.has(p.key)} onClick={() => togglePriority(p.key)} />
        ))}
        <span className="ml-2 text-xs text-ink-muted">Value:</span>
        <input
          value={valueMin}
          onChange={(e) => setValueMin(e.target.value)}
          placeholder="Min"
          type="number"
          className="w-20 rounded-lg border border-black/[0.10] px-2 py-1 text-xs"
        />
        <span className="text-xs text-ink-muted">to</span>
        <input
          value={valueMax}
          onChange={(e) => setValueMax(e.target.value)}
          placeholder="Max"
          type="number"
          className="w-20 rounded-lg border border-black/[0.10] px-2 py-1 text-xs"
        />
        <span className="ml-2 text-xs text-ink-muted">Country:</span>
        <Select
          value={country}
          onChange={setCountry}
          className="w-32"
          options={[{ value: 'all', label: 'All' }, ...countries.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Open deals</p>
          <p className="mt-1 text-2xl font-bold text-ink-primary">{openDeals.length}</p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Open pipeline value</p>
          <p className="mt-1 text-2xl font-bold text-ink-primary">{formatFullCurrency(openValue)}</p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Won this view</p>
          <p className="mt-1 text-2xl font-bold text-status-good">{formatFullCurrency(wonValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((s) => {
          const stageDeals = dealsByStage.get(s.key) ?? []
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
          return (
            <div
              key={s.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, s.key)}
              className="flex flex-col gap-2 rounded-xl border border-black/[0.06] bg-white/60 p-2"
              style={{ borderTop: `3px solid ${s.accent}` }}
            >
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
                  {s.label}
                  <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                    {stageDeals.length}
                  </span>
                </span>
                {stageValue > 0 && <span className="text-xs font-medium text-ink-secondary">{formatFullCurrency(stageValue)}</span>}
              </div>
              <div className="flex min-h-[120px] flex-col gap-2">
                {stageDeals.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-black/[0.10] p-6 text-center text-xs text-ink-muted">
                    Drop deals here
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} onRemove={handleRemove} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {newDealDrawer}
    </div>
  )
}
