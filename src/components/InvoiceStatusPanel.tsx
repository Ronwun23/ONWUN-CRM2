import { useApp } from '@/context/AppContext'
import { Select } from '@/components/ui/select'
import { formatDate, formatFullCurrency } from '@/lib/format'
import type { Client, ClientDocument } from '@/types'

const APPROVAL_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
]

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
]

const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function InvoiceStatusPanel({ client, doc }: { client: Client; doc: ClientDocument }) {
  const { setInvoiceApproval, setInvoicePaid } = useApp()

  return (
    <div className="flex h-fit w-80 shrink-0 flex-col gap-3">
      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Invoice</p>
        <div className="flex flex-col gap-2.5 text-sm">
          {doc.invoiceNumber && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Number</span>
              <span className="font-medium text-ink-primary">{doc.invoiceNumber}</span>
            </div>
          )}
          {doc.billedToName && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Billed to</span>
              <span className="font-medium text-ink-primary">{doc.billedToName}</span>
            </div>
          )}
          {doc.issuedDate && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Issued</span>
              <span className="font-medium text-ink-primary">{formatDate(doc.issuedDate)}</span>
            </div>
          )}
          {doc.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Due</span>
              <span className="font-medium text-ink-primary">{formatDate(doc.dueDate)}</span>
            </div>
          )}
          {doc.amount != null && (
            <div className="flex items-center justify-between border-t border-black/[0.06] pt-2.5">
              <span className="text-ink-muted">Amount</span>
              <span className="font-semibold text-ink-primary">{formatFullCurrency(doc.amount)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Status</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Approved</label>
            <Select
              value={doc.invoiceApproved ? 'approved' : 'pending'}
              onChange={(v) => setInvoiceApproval(client.id, doc.id, v === 'approved')}
              options={APPROVAL_OPTIONS}
            />
          </div>
          <div>
            <label className={labelClass}>Paid</label>
            <Select
              value={doc.status === 'paid' ? 'paid' : 'unpaid'}
              onChange={(v) => setInvoicePaid(client.id, doc.id, v === 'paid')}
              options={PAYMENT_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
