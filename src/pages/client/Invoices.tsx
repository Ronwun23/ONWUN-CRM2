import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import type { PillTone } from '@/components/Pill'
import Drawer from '@/components/Drawer'
import DocumentForm from '@/components/DocumentForm'
import { formatDate, formatFullCurrency } from '@/lib/format'
import { todayCivil } from '@/lib/civilDate'
import type { ClientDocument } from '@/types'

type InvoiceState = 'draft' | 'approved' | 'paid'

function invoiceState(doc: ClientDocument): InvoiceState {
  if (doc.status === 'paid') return 'paid'
  if (doc.invoiceApproved) return 'approved'
  return 'draft'
}

const STATE_LABEL: Record<InvoiceState, string> = { draft: 'Draft', approved: 'Approved', paid: 'Paid' }
const STATE_TONE: Record<InvoiceState, PillTone> = { draft: 'neutral', approved: 'brand', paid: 'good' }

const TABS: { key: InvoiceState | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
]

export default function ClientInvoices() {
  const client = useClientOutlet()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState<InvoiceState | 'all'>('all')

  const invoices = useMemo(() => client.documents.filter((d) => d.type === 'invoice'), [client.documents])
  const today = todayCivil()

  const counts = useMemo(() => {
    const c: Record<InvoiceState | 'all', number> = { all: invoices.length, draft: 0, approved: 0, paid: 0 }
    for (const doc of invoices) c[invoiceState(doc)]++
    return c
  }, [invoices])

  const stats = useMemo(() => {
    let open = 0
    let overdue = 0
    let paid = 0
    let openCount = 0
    let paidCount = 0
    for (const doc of invoices) {
      const amount = doc.amount ?? 0
      const state = invoiceState(doc)
      if (state === 'paid') {
        paid += amount
        paidCount++
      } else if (state === 'approved') {
        open += amount
        openCount++
        if (doc.dueDate && doc.dueDate < today) overdue += amount
      }
    }
    return { open, overdue, paid, openCount, paidCount }
  }, [invoices, today])

  const filtered = tab === 'all' ? invoices : invoices.filter((d) => invoiceState(d) === tab)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/clients/${client.id}/documents`}
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={13} />
        Documents
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-primary">Invoices</h1>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-sm font-semibold text-white hover:bg-black/85"
          >
            <Plus size={14} />
            New invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Open</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold text-ink-primary">{formatFullCurrency(stats.open, 'GBP')}</p>
            {stats.openCount > 0 && (
              <Pill tone="neutral">
                {stats.openCount} invoice{stats.openCount === 1 ? '' : 's'}
              </Pill>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Overdue</p>
          <p className={clsx('mt-1 text-2xl font-bold', stats.overdue > 0 ? 'text-status-critical' : 'text-ink-primary')}>
            {formatFullCurrency(stats.overdue, 'GBP')}
          </p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Paid</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold text-ink-primary">{formatFullCurrency(stats.paid, 'GBP')}</p>
            {stats.paidCount > 0 && (
              <Pill tone="good">
                {stats.paidCount} invoice{stats.paidCount === 1 ? '' : 's'}
              </Pill>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-black/[0.06] bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
              tab === t.key ? 'bg-surface-sunken text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            {t.label}
            <span className="text-xs text-ink-muted">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {invoices.length === 0 ? 'No invoices yet.' : 'No invoices match this filter.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] text-xs font-medium uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Billed to</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const state = invoiceState(doc)
                const overdue = state === 'approved' && !!doc.dueDate && doc.dueDate < today
                return (
                  <tr key={doc.id} className={clsx(i > 0 && 'border-t border-black/[0.05]')}>
                    <td className="px-4 py-3.5">
                      <Pill tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Pill>
                    </td>
                    <td className="p-0">
                      <Link
                        to={`/clients/${client.id}/documents/${doc.id}`}
                        className="block px-4 py-3.5 font-semibold text-ink-primary hover:underline"
                      >
                        {doc.invoiceNumber || doc.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">{doc.billedToName || '—'}</td>
                    <td className="px-4 py-3.5 text-ink-secondary">{doc.issuedDate ? formatDate(doc.issuedDate) : '—'}</td>
                    <td className={clsx('px-4 py-3.5', overdue ? 'font-medium text-status-critical' : 'text-ink-secondary')}>
                      {doc.dueDate ? formatDate(doc.dueDate) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink-primary">
                      {doc.amount != null ? formatFullCurrency(doc.amount, 'GBP') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="New invoice">
        <DocumentForm clientId={client.id} initialType="invoice" onDone={() => setShowAdd(false)} />
      </Drawer>
    </div>
  )
}
