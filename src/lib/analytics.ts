import type { Lead, Source, Stage } from '@/types'
import { OPEN_STAGES, STAGES } from '@/types'
import { OWNERS } from '@/data/owners'

export interface StageBucket {
  stage: Stage
  count: number
  value: number
}

export interface SourceBucket {
  source: Source
  count: number
}

export interface MonthBucket {
  label: string
  key: string
  newLeads: number
  wonValue: number
}

export interface OwnerBucket {
  ownerId: string
  name: string
  color: string
  won: number
  lost: number
  open: number
  wonValue: number
  winRate: number
}

export function stageBreakdown(leads: Lead[]): StageBucket[] {
  return STAGES.map((stage) => {
    const inStage = leads.filter((l) => l.stage === stage)
    return { stage, count: inStage.length, value: inStage.reduce((s, l) => s + l.value, 0) }
  })
}

export function sourceBreakdown(leads: Lead[]): SourceBucket[] {
  const map = new Map<Source, number>()
  for (const lead of leads) map.set(lead.source, (map.get(lead.source) ?? 0) + 1)
  return Array.from(map.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}

export function monthlyTrend(leads: Lead[], months = 6): MonthBucket[] {
  const now = new Date('2026-09-17T12:00:00Z')
  const buckets: MonthBucket[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    buckets.push({ label, key, newLeads: 0, wonValue: 0 })
  }

  const keyOf = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${d.getMonth()}`
  }

  for (const lead of leads) {
    const createdKey = keyOf(lead.createdAt)
    const createdBucket = buckets.find((b) => b.key === createdKey)
    if (createdBucket) createdBucket.newLeads += 1

    if (lead.stage === 'won' && lead.closeDate) {
      const closedKey = keyOf(lead.closeDate)
      const closedBucket = buckets.find((b) => b.key === closedKey)
      if (closedBucket) closedBucket.wonValue += lead.value
    }
  }

  return buckets
}

export function ownerBreakdown(leads: Lead[]): OwnerBucket[] {
  return OWNERS.map((owner) => {
    const mine = leads.filter((l) => l.owner === owner.id)
    const won = mine.filter((l) => l.stage === 'won')
    const lost = mine.filter((l) => l.stage === 'lost')
    const open = mine.filter((l) => OPEN_STAGES.includes(l.stage))
    const decided = won.length + lost.length
    return {
      ownerId: owner.id,
      name: owner.name,
      color: owner.color,
      won: won.length,
      lost: lost.length,
      open: open.length,
      wonValue: won.reduce((s, l) => s + l.value, 0),
      winRate: decided === 0 ? 0 : won.length / decided,
    }
  }).sort((a, b) => b.wonValue - a.wonValue)
}

export function summary(leads: Lead[]) {
  const won = leads.filter((l) => l.stage === 'won')
  const lost = leads.filter((l) => l.stage === 'lost')
  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage))
  const decided = won.length + lost.length

  return {
    totalLeads: leads.length,
    openCount: open.length,
    openValue: open.reduce((s, l) => s + l.value, 0),
    wonValue: won.reduce((s, l) => s + l.value, 0),
    winRate: decided === 0 ? 0 : won.length / decided,
    avgDealSize: won.length === 0 ? 0 : won.reduce((s, l) => s + l.value, 0) / won.length,
  }
}
