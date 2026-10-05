import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Modal from '@/components/Modal'
import SignaturePad from '@/components/SignaturePad'
import { formatDate } from '@/lib/format'
import type { Client, ClientDocument, DocumentSignature } from '@/types'

function SignatureRow({
  label,
  role,
  signature,
  signedOff,
  onToggle,
}: {
  label: string
  role: string
  signature?: DocumentSignature
  signedOff: boolean
  onToggle?: (signedOff: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-primary">{label}</p>
        <p className="text-xs text-ink-muted">
          {role}
          {signature && ` · signed ${formatDate(signature.createdAt)}`}
        </p>
      </div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
        <input
          type="checkbox"
          checked={signedOff}
          disabled={!onToggle}
          onChange={(e) => onToggle?.(e.target.checked)}
          className="h-4 w-4 rounded border-black/20 accent-brand-500 disabled:opacity-50"
        />
        Signed
      </label>
    </div>
  )
}

export default function ContractSignaturePanel({ client, doc }: { client: Client; doc: ClientDocument }) {
  const { setDocumentSignature, setContractSignedOff, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [showPad, setShowPad] = useState(false)

  const myParty: 'agency' | 'client' = isClientView ? 'client' : 'agency'
  const myName = isClientView ? client.name : activeAccount.name
  const otherPartyName = isClientView ? 'Onwun' : client.name
  const mySignature = isClientView ? doc.clientSignature : doc.agencySignature
  const mySignedOff = isClientView ? !!doc.clientSignedOff : !!doc.agencySignedOff
  const bothSignedOff = !!doc.agencySignedOff && !!doc.clientSignedOff
  const hasSignaturePage = !!doc.stampLayout

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
      {bothSignedOff && (
        <div className="rounded-xl border border-[#cdead0] bg-[#e8f7e8] px-4 py-3">
          <p className="text-sm font-medium text-[#0d6b0d]">Signed by all parties</p>
          <p className="text-xs text-[#0d6b0d]/80">Onwun and {client.name}</p>
        </div>
      )}

      {!isClientView && !hasSignaturePage && (
        <div className="rounded-xl border border-black/[0.06] bg-[#fdf1de] px-4 py-3">
          <p className="text-xs text-[#96660a]">
            This PDF doesn't have a signature page yet — re-upload it via Edit to add one automatically, so
            signing actually stamps the file.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-ink-primary">
          {bothSignedOff ? 'Signed' : mySignedOff ? 'Waiting on 1 signature' : 'Your signature'}
        </p>
        <p className="mb-3 text-xs text-ink-secondary">
          {bothSignedOff
            ? 'A signed contract never changes.'
            : mySignedOff
              ? `You've confirmed your signature. Waiting for ${otherPartyName} to confirm theirs.`
              : mySignature
                ? 'Tick "Signed" below once you\'re happy with your signature on the PDF.'
                : 'Draw your signature below, then tick "Signed" below to confirm it.'}
        </p>
        {!mySignature && (
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
          <SignatureRow
            label="Onwun"
            role="The agency"
            signature={doc.agencySignature}
            signedOff={!!doc.agencySignedOff}
            onToggle={!isClientView ? (v) => setContractSignedOff(client.id, doc.id, 'agency', v) : undefined}
          />
          <SignatureRow
            label={client.name}
            role="The client"
            signature={doc.clientSignature}
            signedOff={!!doc.clientSignedOff}
            onToggle={isClientView ? (v) => setContractSignedOff(client.id, doc.id, 'client', v) : undefined}
          />
        </div>
      </div>

      <Modal open={showPad} onClose={() => setShowPad(false)} title="Sign this contract" subtitle={`Signing as ${myName}.`}>
        <SignaturePad onSign={handleSign} onCancel={() => setShowPad(false)} />
      </Modal>
    </div>
  )
}
