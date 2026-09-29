import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, PoundSterling, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { useClientOutlet } from '@/lib/useClient'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import type { PillTone } from '@/components/Pill'
import Drawer from '@/components/Drawer'
import Modal from '@/components/Modal'
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
  const { updateClientProfile } = useApp()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)
  const [showTotal, setShowTotal] = useState(false)
  const [totalInput, setTotalInput] = useState('')
  const [tab, setTab] = useState<InvoiceState | 'all'>('all')

  const openTotalModal = () => {
    setTotalInput(client.invoiceTotalValue != null ? String(client.invoiceTotalValue) : '')
    setShowTotal(true)
  }

  const handleSaveTotal = () => {
    updateClientProfile(client.id, { invoiceTotalValue: totalInput.trim() ? Number(totalInput) : undefined })
    setShowTotal(false)
  }

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
        <h1 className="text-lg font-semibold text-ink-primary">Invoices</h1>
        {!isClientView && (
          <div className="flex items-center gap-2">
            <button
              onClick={openTotalModal}
              className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface-sunken"
            >
              <PoundSterling size={12} />
              {client.invoiceTotalValue != null ? `Total: ${formatFullCurrency(client.invoiceTotalValue, 'GBP')}` : 'Total amount'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
            >
              <Plus size={12} />
              New invoice
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-3.5 shadow-card">
          <p className="text-xs text-ink-muted">Open</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold text-ink-primary">{formatFullCurrency(stats.open, 'GBP')}</p>
            {stats.openCount > 0 && (
              <Pill tone="neutral">
                {stats.openCount} invoice{stats.openCount === 1 ? '' : 's'}
              </Pill>
            )}
          </div>
          {client.invoiceTotalValue != null && (
            <p className="mt-1 text-xs text-ink-muted">of {formatFullCurrency(client.invoiceTotalValue, 'GBP')} total</p>
          )}
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-3.5 shadow-card">
          <p className="text-xs text-ink-muted">Overdue</p>
          <p className={clsx('mt-1 text-2xl font-semibold', stats.overdue > 0 ? 'text-status-critical' : 'text-ink-primary')}>
            {formatFullCurrency(stats.overdue, 'GBP')}
          </p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-3.5 shadow-card">
          <p className="text-xs text-ink-muted">Paid</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold text-ink-primary">{formatFullCurrency(stats.paid, 'GBP')}</p>
            {stats.paidCount > 0 && (
              <Pill tone="good">
                {stats.paidCount} invoice{stats.paidCount === 1 ? '' : 's'}
              </Pill>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
            )}
          >
            {t.label}
            <span
              className={clsx(
                'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                tab === t.key ? 'bg-black/[0.06] text-ink-primary' : 'bg-black/[0.04] text-ink-muted'
              )}
            >
              {counts[t.key]}
            </span>
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
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Number</th>
                <th className="px-3.5 py-2.5">Billed to</th>
                <th className="px-3.5 py-2.5">Issued</th>
                <th className="px-3.5 py-2.5">Due</th>
                <th className="px-3.5 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const state = invoiceState(doc)
                const overdue = state === 'approved' && !!doc.dueDate && doc.dueDate < today
                return (
                  <tr key={doc.id} className={clsx(i > 0 && 'border-t border-black/[0.05]')}>
                    <td className="px-3.5 py-2.5">
                      <Pill tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Pill>
                    </td>
                    <td className="p-0">
                      <Link
                        to={`/clients/${client.id}/documents/${doc.id}`}
                        className="block px-3.5 py-2.5 font-semibold text-ink-primary hover:underline"
                      >
                        {doc.invoiceNumber || doc.title}
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5 text-ink-secondary">{doc.billedToName || '—'}</td>
                    <td className="px-3.5 py-2.5 text-ink-secondary">{doc.issuedDate ? formatDate(doc.issuedDate) : '—'}</td>
                    <td className={clsx('px-3.5 py-2.5', overdue ? 'font-medium text-status-critical' : 'text-ink-secondary')}>
                      {doc.dueDate ? formatDate(doc.dueDate) : '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-semibold text-ink-primary">
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

      <Modal
        open={showTotal}
        onClose={() => setShowTotal(false)}
        title="Total amount"
        subtitle="The full project value — shown next to Open so you and the client can see how much of it's been invoiced."
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Amount (£)</label>
            <input
              type="number"
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              placeholder="20000"
              autoFocus
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoComplete="off"
            />
          </div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowTotal(false)}
              className="rounded-lg border border-black/[0.10] bg-white px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface-sunken"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTotal}
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
