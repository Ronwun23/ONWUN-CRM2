import type { PillTone } from '@/components/Pill'
import type { ClientStatus, DocumentStatus, DocumentType } from '@/types'

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  with_client: 'With the client',
  with_you: 'With you',
  signed: 'Signed',
  paid: 'Paid',
  unpaid: 'Unpaid',
  draft: 'Draft',
}

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, PillTone> = {
  with_client: 'brand',
  with_you: 'warning',
  signed: 'good',
  paid: 'good',
  unpaid: 'critical',
  draft: 'neutral',
}

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  proposal: 'Proposal',
  contract: 'Contract',
  invoice: 'Invoice',
  strategy: 'Strategy',
  presentation: 'Presentation',
  guidelines: 'Guidelines',
  other: 'Other',
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
}

export const CLIENT_STATUS_TONE: Record<ClientStatus, PillTone> = {
  active: 'good',
  paused: 'warning',
  completed: 'brand',
}
