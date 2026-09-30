import type { PillTone } from '@/components/Pill'
import type { ClientStatus, ContentEventType, DocumentStatus, DocumentType, LeadSource, LeadStatus, ReelDuration } from '@/types'

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  with_client: 'With the client',
  with_you: 'With you',
  signed: 'Signed',
  paid: 'Paid',
  unpaid: 'Unpaid',
  draft: 'Pending',
  changes_requested: 'Request change',
  approved: 'Approved',
}

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, PillTone> = {
  with_client: 'orange',
  with_you: 'warning',
  signed: 'good',
  paid: 'good',
  unpaid: 'critical',
  draft: 'neutral',
  changes_requested: 'critical',
  approved: 'good',
}

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  proposal: 'Proposal',
  contract: 'Contract',
  invoice: 'Invoice',
  strategy: 'Strategy',
  presentation: 'Presentation',
  moodboard: 'Visual moodboard',
  identity: 'Visual identity',
  guidelines: 'Guidelines',
  offboarding: 'Offboarding',
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

export const CONTENT_EVENT_TYPE_LABEL: Record<ContentEventType, string> = {
  shoot_day: 'Shoot day',
  reel: 'Reel',
  static: 'Static',
  story: 'Story',
  carousel: 'Carousel',
}

export const REEL_DURATION_LABEL: Record<ReelDuration, string> = {
  '0_5': '0-5 secs',
  '5_10': '5-10 secs',
  '10_20': '10-20 secs',
  '20_plus': '20 secs +',
}

export const LEAD_STATUS_TONE: Record<LeadStatus, PillTone> = {
  new: 'neutral',
  contacted: 'brand',
  wants_video: 'brand',
  video_sent: 'brand',
  call_booked: 'good',
  live_conversation: 'good',
  not_now: 'warning',
  suppressed: 'critical',
  converted: 'good',
}

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  ads: 'Ads',
  referral: 'Referral',
  website: 'Website',
  existing_client: 'Existing client',
  other: 'Other',
}

export const LEAD_SOURCE_TONE: Record<LeadSource, PillTone> = {
  ads: 'warning',
  referral: 'good',
  website: 'brand',
  existing_client: 'critical',
  other: 'neutral',
}
