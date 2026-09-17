import type { Activity, Lead, Priority, Source, Stage } from '@/types'
import { OWNERS } from './owners'

// Deterministic PRNG so mock data is stable across reloads/builds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260917)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Cameron',
  'Avery', 'Quinn', 'Harper', 'Reese', 'Emerson', 'Rowan', 'Skylar', 'Elliot',
  'Hayden', 'Parker', 'Dakota', 'Sawyer', 'Finley', 'Blake', 'Charlie', 'Drew',
  'Kendall', 'Peyton', 'Marlowe', 'Sage', 'Tatum', 'Remy', 'Noor', 'Ines',
  'Keiko', 'Tobias', 'Ravi', 'Lucia', 'Omar', 'Greta', 'Malik', 'Anya',
]
const LAST_NAMES = [
  'Bennett', 'Carrasco', 'Dubois', 'Eriksson', 'Falk', 'Gao', 'Haddad', 'Ibarra',
  'Jansen', 'Kowalski', 'Lindqvist', 'Mercer', 'Nakamura', 'Okafor', 'Petrov',
  'Quintana', 'Rahman', 'Suzuki', 'Tanaka', 'Ueda', 'Vance', 'Whitfield', 'Xiao',
  'Yilmaz', 'Zimmerman', 'Ahn', 'Boateng', 'Castellano', 'Dahl', 'Ferreira',
]
const COMPANY_PREFIX = [
  'Brightline', 'Northgate', 'Cobalt', 'Meridian', 'Fernwood', 'Solstice',
  'Anchorpoint', 'Silverline', 'Redwood', 'Havenwell', 'Ironbark', 'Bluecrest',
  'Foundry', 'Lumen', 'Vantage', 'Clearwater', 'Amberfield', 'Highline',
  'Cedarwood', 'Novasys', 'Greystone', 'Pinebrook', 'Truenorth', 'Aldergate',
  'Westbound', 'Kindred', 'Overlook', 'Brookfield', 'Starling', 'Fairhaven',
]
const COMPANY_SUFFIX = [
  'Logistics', 'Health Group', 'Retail Co', 'Manufacturing', 'Financial',
  'Analytics', 'Media', 'Robotics', 'Foods', 'Energy', 'Realty', 'Labs',
  'Insurance', 'Apparel', 'Software', 'Consulting', 'Biotech', 'Freight',
  'Hospitality', 'Studios',
]
const INDUSTRIES = [
  'Logistics', 'Healthcare', 'Retail', 'Manufacturing', 'Finance', 'Technology',
  'Media', 'Energy', 'Real Estate', 'Hospitality', 'Insurance', 'Biotech',
]
const TITLES = [
  'VP of Operations', 'Director of Procurement', 'Head of Growth', 'CFO',
  'COO', 'IT Director', 'Founder & CEO', 'VP of Sales', 'Procurement Manager',
  'Director of Marketing', 'Chief of Staff', 'Operations Manager',
]
const SOURCES: Source[] = [
  'Referral', 'Website', 'Cold Outreach', 'Event', 'Partner', 'Social Media', 'Inbound Call',
]

// Stage distribution weighted toward an open, healthy pipeline.
const STAGE_WEIGHTS: [Stage, number][] = [
  ['new', 16],
  ['contacted', 15],
  ['qualified', 14],
  ['proposal', 11],
  ['negotiation', 8],
  ['won', 13],
  ['lost', 10],
]

function weightedStage(): Stage {
  const total = STAGE_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [stage, w] of STAGE_WEIGHTS) {
    if (r < w) return stage
    r -= w
  }
  return 'new'
}

const NOTE_TEMPLATES = [
  'Sent over the intro deck and pricing overview.',
  'Discovery call — mapped current workflow and pain points.',
  'Followed up after no response, left voicemail.',
  'Demo completed, positive reaction from the team.',
  'Requested a proposal with three pricing tiers.',
  'Looped in their procurement lead for next steps.',
  'Rescheduled call to next week — conflict on their end.',
  'Shared case study relevant to their industry.',
  'Contract sent for legal review.',
  'Negotiating on implementation timeline.',
  'Champion confirmed budget is approved for this quarter.',
  'Lost to a competitor on price.',
  'Closed won — kickoff scheduled with onboarding team.',
  'Check-in call, still evaluating internally.',
  'Referral intro call — warm lead, high interest.',
]

function daysAgo(n: number): Date {
  const d = new Date('2026-09-17T12:00:00Z')
  d.setDate(d.getDate() - n)
  return d
}

function iso(d: Date): string {
  return d.toISOString()
}

function buildActivities(createdAt: Date, stage: Stage, count: number): Activity[] {
  const activities: Activity[] = []
  const types: Activity['type'][] = ['note', 'call', 'email', 'meeting']
  let cursor = new Date(createdAt)
  for (let i = 0; i < count; i++) {
    cursor = new Date(cursor.getTime() + int(1, 6) * 86400000)
    if (cursor.getTime() > Date.now()) break
    activities.push({
      id: `act-${createdAt.getTime()}-${i}`,
      type: i === count - 1 && (stage === 'won' || stage === 'lost') ? 'stage_change' : pick(types),
      text: pick(NOTE_TEMPLATES),
      date: iso(cursor),
    })
  }
  return activities
}

function makeLead(index: number): Lead {
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const company = `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}`
  const stage = weightedStage()
  const createdOffset = int(2, 165)
  const createdAt = daysAgo(createdOffset)
  const owner = pick(OWNERS)
  const activityCount = int(1, 5)
  const activities = buildActivities(createdAt, stage, activityCount)
  const lastActivityAt = activities.length
    ? activities[activities.length - 1].date
    : iso(createdAt)

  const baseValue = int(4, 120) * 1000
  const priority: Priority = baseValue > 80000 ? 'high' : baseValue > 30000 ? 'medium' : 'low'

  const closeDate =
    stage === 'won' || stage === 'lost'
      ? iso(new Date(createdAt.getTime() + int(7, 90) * 86400000))
      : undefined

  return {
    id: `lead-${index}`,
    name: `${first} ${last}`,
    company,
    title: pick(TITLES),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.split(' ')[0].toLowerCase()}.com`,
    phone: `(${int(200, 989)}) ${int(200, 989)}-${int(1000, 9999)}`,
    industry: pick(INDUSTRIES),
    source: pick(SOURCES),
    stage,
    value: baseValue,
    owner: owner.id,
    priority,
    createdAt: iso(createdAt),
    lastActivityAt,
    closeDate,
    activities,
  }
}

export const MOCK_LEADS: Lead[] = Array.from({ length: 68 }, (_, i) => makeLead(i + 1))
