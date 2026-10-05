import { Suspense, lazy, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import Modal from '@/components/Modal'
import SignaturePad from '@/components/SignaturePad'
import Spinner from '@/components/Spinner'
import { formatDate } from '@/lib/format'
import type { Client, ClientDocument, DocumentSignature } from '@/types'

// pdfjs-dist is a large dependency — only fetch it (and this component)
// when the agency actually opens the positioner, not on every page load.
const ContractStampPositioner = lazy(() => import('@/components/ContractStampPositioner'))

const STAMP_FIELDS = ['designerSignature', 'designerDate', 'clientSignature', 'clientDate'] as const

function SignatureRow({ label, role, signature }: { label: string; role: string; signature?: DocumentSignature }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-primary">{label}</p>
        <p className="text-xs text-ink-muted">{role}</p>
      </div>
      {signature ? (
        <Pill tone="good">Signed {formatDate(signature.createdAt)}</Pill>
      ) : (
        <Pill tone="neutral">Awaiting</Pill>
      )}
    </div>
  )
}

export default function ContractSignaturePanel({ client, doc }: { client: Client; doc: ClientDocument }) {
  const { setDocumentSignature, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [showPad, setShowPad] = useState(false)
  const [showPositioner, setShowPositioner] = useState(false)

  const myParty: 'agency' | 'client' = isClientView ? 'client' : 'agency'
  const myName = isClientView ? client.name : activeAccount.name
  const otherPartyName = isClientView ? 'Onwun' : client.name
  const mySignature = isClientView ? doc.clientSignature : doc.agencySignature
  const bothSigned = !!doc.agencySignature && !!doc.clientSignature
  const stampLayoutComplete = STAMP_FIELDS.every((f) => doc.stampLayout?.[f])

  const handleSign = (signatureData: string, dateText: string) => {
    setDocumentSignature(client.id, doc.id, myParty, {
      authorName: myName,
      signatureData,
      dateText,
      createdAt: new Date().toISOString(),
    })
    setShowPad(false)
  }

  return (
    <div className="flex h-fit w-80 shrink-0 flex-col gap-3">
      {bothSigned && (
        <div className="rounded-xl border border-[#cdead0] bg-[#e8f7e8] px-4 py-3">
          <p className="text-sm font-medium text-[#0d6b0d]">Signed by all parties</p>
          <p className="text-xs text-[#0d6b0d]/80">
            {doc.agencySignature!.authorName} and {doc.clientSignature!.authorName}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-ink-primary">
          {bothSigned ? 'Signed' : mySignature ? 'Waiting on the other party' : 'Your signature'}
        </p>
        <p className="mb-3 text-xs text-ink-secondary">
          {bothSigned
            ? 'A signed contract never changes.'
            : mySignature
              ? `You signed this on ${formatDate(mySignature.createdAt)}. Waiting for ${otherPartyName} to sign.`
              : 'Draw your signature below to sign this contract.'}
        </p>
        {!bothSigned && !mySignature && (
          <button
            onClick={() => setShowPad(true)}
            className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Sign
          </button>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Signatures</p>
        <div className="flex flex-col gap-3">
          <SignatureRow label="Onwun" role="The agency" signature={doc.agencySignature} />
          <SignatureRow label={client.name} role="The client" signature={doc.clientSignature} />
        </div>
      </div>

      {!isClientView && !bothSigned && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-4">
          <p className="mb-1 text-sm font-semibold text-ink-primary">Signature positions</p>
          <p className="mb-3 text-xs text-ink-secondary">
            {stampLayoutComplete
              ? "Where each signature and date land on the final page — set."
              : 'Mark where the signature and date lines sit on the final page, so the real PDF gets stamped once both of you sign.'}
          </p>
          <button
            onClick={() => setShowPositioner(true)}
            className="rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
          >
            {stampLayoutComplete ? 'Edit positions' : 'Set positions'}
          </button>
        </div>
      )}

      <Modal open={showPad} onClose={() => setShowPad(false)} title="Sign this contract" subtitle={`Signing as ${myName}.`}>
        <SignaturePad onSign={handleSign} onCancel={() => setShowPad(false)} />
      </Modal>

      <Modal
        open={showPositioner}
        onClose={() => setShowPositioner(false)}
        title="Signature positions"
        maxWidthClassName="max-w-3xl"
      >
        <Suspense fallback={<div className="flex h-40 items-center justify-center"><Spinner /></div>}>
          <ContractStampPositioner client={client} doc={doc} onDone={() => setShowPositioner(false)} />
        </Suspense>
      </Modal>
    </div>
  )
}
