import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useCrm } from '@/context/CrmContext'
import type { Lead, Stage } from '@/types'
import { STAGES, STAGE_LABELS } from '@/types'
import { OWNERS } from '@/data/owners'
import StageBadge from '@/components/StageBadge'
import PriorityBadge from '@/components/PriorityBadge'
import { OwnerAvatar, ownerName } from '@/components/Avatar'
import { formatCurrency, formatRelativeDate } from '@/lib/format'
import Drawer from '@/components/Drawer'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import AddLeadForm from '@/components/AddLeadForm'

type SortKey = 'value' | 'recent' | 'name'

export default function LeadsPage() {
  const { leads } = useCrm()
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const filtered = useMemo(() => {
    let result = leads.filter((lead) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q)
      const matchesStage = stageFilter === 'all' || lead.stage === stageFilter
      const matchesOwner = ownerFilter === 'all' || lead.owner === ownerFilter
      return matchesQuery && matchesStage && matchesOwner
    })

    result = result.sort((a, b) => {
      if (sortKey === 'value') return b.value - a.value
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    })

    return result
  }, [leads, query, stageFilter, ownerFilter, sortKey])

  // Re-select the freshest copy of the lead so the drawer reflects live edits.
  const activeLead = selectedLead ? leads.find((l) => l.id === selectedLead.id) ?? null : null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Leads</h1>
          <p className="text-sm text-ink-secondary">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          Add lead
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email…"
            className="w-64 rounded-lg border border-black/[0.10] bg-white py-2 pl-8 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | 'all')}
          className="rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All owners</option>
          {OWNERS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="ml-auto rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="recent">Sort: Most recent</option>
          <option value="value">Sort: Deal value</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="cursor-pointer border-b border-black/[0.04] last:border-b-0 hover:bg-surface-sunken/60"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-primary">{lead.name}</p>
                  <p className="text-xs text-ink-muted">{lead.company}</p>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-4 py-3 font-medium tabular-nums text-ink-primary">
                  {formatCurrency(lead.value)}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={lead.priority} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <OwnerAvatar ownerId={lead.owner} size={22} />
                    <span className="text-ink-secondary">{ownerName(lead.owner)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{lead.source}</td>
                <td className="px-4 py-3 text-ink-secondary">{formatRelativeDate(lead.lastActivityAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">No leads match your filters.</p>
        )}
      </div>

      <Drawer open={!!activeLead} onClose={() => setSelectedLead(null)} title="Lead details">
        {activeLead && <LeadDetailPanel lead={activeLead} />}
      </Drawer>

      <Drawer open={showAddForm} onClose={() => setShowAddForm(false)} title="Add a new lead">
        <AddLeadForm onDone={() => setShowAddForm(false)} />
      </Drawer>
    </div>
  )
}
