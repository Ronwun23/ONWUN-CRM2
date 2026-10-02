import { useApp } from '@/context/AppContext'
import { Select } from '@/components/ui/select'
import type { Client, ClientDocument } from '@/types'

const REVIEW_OPTIONS = [
  { value: 'changes_requested', label: 'Request change' },
  { value: 'approved', label: 'Approve' },
]

export default function DocumentReviewPanel({ client, doc }: { client: Client; doc: ClientDocument }) {
  const { setDocumentReviewStatus } = useApp()

  const value = doc.status === 'approved' || doc.status === 'changes_requested' ? doc.status : undefined

  return (
    <div className="w-full rounded-xl border border-black/[0.06] bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Review</p>
      <Select
        value={value ?? ''}
        onChange={(v) => setDocumentReviewStatus(client.id, doc.id, v as 'approved' | 'changes_requested', client.name)}
        options={REVIEW_OPTIONS}
        placeholder="Choose an action…"
      />
    </div>
  )
}
