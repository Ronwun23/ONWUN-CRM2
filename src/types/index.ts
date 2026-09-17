export const STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export const OPEN_STAGES: Stage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation']

export type Priority = 'low' | 'medium' | 'high'

export type Source =
  | 'Referral'
  | 'Website'
  | 'Cold Outreach'
  | 'Event'
  | 'Partner'
  | 'Social Media'
  | 'Inbound Call'

export interface Activity {
  id: string
  type: 'note' | 'call' | 'email' | 'meeting' | 'stage_change'
  text: string
  date: string
}

export interface Lead {
  id: string
  name: string
  company: string
  title: string
  email: string
  phone: string
  industry: string
  source: Source
  stage: Stage
  value: number
  owner: string
  priority: Priority
  createdAt: string
  lastActivityAt: string
  closeDate?: string
  activities: Activity[]
}

export interface Owner {
  id: string
  name: string
  initials: string
  color: string
}
