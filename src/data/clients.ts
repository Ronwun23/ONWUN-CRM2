import type {
  BrandAsset,
  Client,
  ClientDocument,
  ClientEvent,
  ClientTask,
  LibraryItem,
  PhaseKey,
  ProjectPhase,
  UpdateEntry,
  WorkshopState,
} from '@/types'
import { PHASES } from '@/types'
import { TEAM, CURRENT_USER } from './team'
import { WORKSHOP_PHASES } from './workshopTemplate'
import { synthesizeStrategy } from '@/lib/strategySynthesis'

const TODAY = new Date('2026-09-18T09:00:00Z')

function daysFrom(offset: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

const STEP_TEMPLATES: Record<PhaseKey, string[]> = {
  discovery: ['Kickoff call', 'Brand questionnaire', 'Competitor research', 'Discovery summary'],
  strategy: ['Brand strategy doc', 'Positioning workshop', 'Strategy sign-off'],
  design: ['Moodboard & direction', 'Logo concepts', 'Logo refinement', 'Full brand identity design'],
  delivery: ['Final brand presentation', 'Brand guidelines hub', 'Handover: logo pack, fonts, presentation'],
}

let stepCounter = 0
let uid = 0
const nextId = (prefix: string) => `${prefix}-${++uid}`

function buildPhases(currentPhaseIndex: number, stepsDoneInCurrentPhase: number, startOffset: number): ProjectPhase[] {
  let cursor = startOffset
  return PHASES.map((key, phaseIndex) => {
    const titles = STEP_TEMPLATES[key]
    const steps = titles.map((title, i) => {
      stepCounter += 1
      const isBeforeCurrent = phaseIndex < currentPhaseIndex
      const isCurrentDone = phaseIndex === currentPhaseIndex && i < stepsDoneInCurrentPhase
      const done = isBeforeCurrent || isCurrentDone
      if (done) cursor += 3
      return {
        id: `step-${stepCounter}`,
        title,
        done,
        completedAt: done ? daysFrom(cursor) : undefined,
      }
    })
    return { key, steps }
  })
}

function emptyWorkshop(): WorkshopState {
  return {
    started: false,
    completed: false,
    currentPhaseIndex: 0,
    currentScreen: 'intro',
    currentQuestionIndex: 0,
    answers: {},
    transcript: '',
    strategy: null,
  }
}

const NEW_CLIENT_COLORS = ['#6a60f6', '#eb6834', '#1baf7a', '#e87ba4', '#eda100', '#4a3aa7']

export function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part.match(/[a-z0-9]/i)?.[0] ?? '')
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function blankPhases(): ProjectPhase[] {
  return PHASES.map((key) => ({
    key,
    steps: STEP_TEMPLATES[key].map((title) => {
      stepCounter += 1
      return { id: `step-${stepCounter}`, title, done: false }
    }),
  }))
}

// Every client — new or existing — starts a project with the same document
// checklist, matching the full set every other client project runs through.
// They begin as drafts and get filled in as the engagement progresses.
export function blankDocuments(): ClientDocument[] {
  const now = new Date().toISOString()
  return [
    { id: nextId('doc'), title: 'Proposal', type: 'proposal', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Contract', type: 'contract', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Invoices', type: 'invoice', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Brand Strategy', type: 'strategy', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Speed Run Presentation 1', type: 'presentation', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Speed Run Presentation 2', type: 'presentation', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Final Brand Presentation', type: 'presentation', status: 'draft', updatedAt: now },
    { id: nextId('doc'), title: 'Figma Brand Guidelines', type: 'guidelines', status: 'draft', updatedAt: now },
  ]
}

export function createBlankClient(input: {
  name: string
  projectName: string
  owner: string
  dueDate: string
}): Client {
  const id = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`

  return {
    id,
    name: input.name,
    projectName: input.projectName,
    initials: initialsFromName(input.name),
    color: NEW_CLIENT_COLORS[Math.floor(Math.random() * NEW_CLIENT_COLORS.length)],
    status: 'active',
    owner: input.owner,
    startDate: new Date().toISOString(),
    dueDate: input.dueDate,
    phases: blankPhases(),
    documents: blankDocuments(),
    tasks: [],
    updates: [],
    library: [],
    brandHub: [],
    events: [],
    workshop: emptyWorkshop(),
  }
}

const BLOOM_SAMPLE_ANSWERS: Record<string, string> = {
  'p1-q1': 'Bloom Ventures',
  'p1-q2':
    "James spent years alongside early-stage companies with real momentum — companies with product-market fit, capable teams that were already winning. What he saw, time and again, was the single thing that compounded their velocity: operators who had done it before, embedded in the work alongside them.",
  'p1-q3':
    "Capital and advice are table stakes. What's rare — and what actually catalyses growth — is proven operators sitting on the same side of the table, treating the company's success as their own.",
  'p1-q4': "\"Bloom\" — growth that compounds quietly, season after season, rather than a single loud moment.",
  'p2-q1': 'Founders of early-stage companies with product-market fit, and the operators who back them.',
  'p2-q2': 'A venture-style partner, run by operators who have won, bringing capital and execution as a single offering.',
  'p2-q3': "We don't just advise — we get embedded in the work, driving distribution and product alongside the team.",
  'p2-q4': "Build what people want. Stand alongside the people building it. The outcome follows.",
  'p3-q1': 'Replace the passive cheque-and-board-seat model with operators who actually get in the work — so founders stop losing momentum waiting on advice that never ships.',
  'p3-q2': 'A portfolio of companies that credit Bloom operators as core to their breakout growth, not just their fundraise.',
  'p3-q3': 'Operators who have won, on the same side of the table as the founder.',
  'p3-q4': 'A brand where "Create great company" is the whole story — capital and execution as a single offering.',
  'p4-q1': 'Relentless, Human, Fearless, Strategic',
  'p4-q2': 'Passive, transactional, or absent once the cheque clears.',
  'p4-q3': 'Founders who talk like operators, not just capital allocators.',
  'p4-q4': 'Prepared, decisive, certain — but curious and grounded first.',
  'p5-q1': 'Early-stage founders with product-market fit and a capable team already winning.',
  'p5-q2': "They have momentum but not enough execution muscle — capital alone won't close that gap.",
  'p5-q3': 'Operators who have actually done it before, not just advisors who talk about it.',
  'p5-q4': "Because we sit on the same side of the table and treat their company's success as our own.",
  'p6-q1': 'Traditional VC funds, angel syndicates',
  'p6-q2': 'Deploy capital efficiently and bring a strong network.',
  'p6-q3': "Most funds stop at the cheque and a board seat — there's room to be embedded operators, not just capital.",
  'p6-q4': "We bring capital and hands-on execution as one offering, not two separate relationships.",
  'p7-q1': 'Confident, direct, and grounded in operator experience.',
  'p7-q2': 'Corporate, hedge-y, or like a pitch deck.',
  'p7-q3': 'Backed by people who have actually done it.',
  'p7-q4': 'Operators-turned-writers who speak plainly about what actually worked.',
  'p8-q1': 'A visual identity and voice that matches how embedded and hands-on the team actually is.',
  'p8-q2': 'Founders instantly understanding Bloom is different from a traditional fund.',
  'p8-q3': 'The default name founders mention when asked who actually helped them grow.',
  'p8-q4': '',
}

function fullWorkshop(strategyStatus: 'ai_draft' | 'approved' = 'ai_draft'): WorkshopState {
  const answers: WorkshopState['answers'] = {}
  for (const phase of WORKSHOP_PHASES) {
    for (const q of phase.questions) {
      answers[q.id] = BLOOM_SAMPLE_ANSWERS[q.id] ?? ''
    }
  }
  const strategy = synthesizeStrategy(answers, '')
  return {
    started: true,
    completed: true,
    currentPhaseIndex: WORKSHOP_PHASES.length - 1,
    currentScreen: 'question',
    currentQuestionIndex: 3,
    answers,
    transcript: '',
    strategy: { ...strategy, status: strategyStatus },
  }
}

function partialWorkshop(throughPhase: number, throughQuestion: number): WorkshopState {
  const answers: WorkshopState['answers'] = {}
  for (let p = 0; p <= throughPhase; p++) {
    const phase = WORKSHOP_PHASES[p]
    const qLimit = p < throughPhase ? phase.questions.length : throughQuestion + 1
    for (let q = 0; q < qLimit; q++) {
      const question = phase.questions[q]
      answers[question.id] = 'Notes captured live with the client during the call.'
    }
  }
  return {
    started: true,
    completed: false,
    currentPhaseIndex: throughPhase,
    currentScreen: 'question',
    currentQuestionIndex: throughQuestion,
    answers,
    transcript: '',
    strategy: null,
  }
}

function docs(entries: [string, ClientDocument['type'], ClientDocument['status'], string | undefined, number][]): ClientDocument[] {
  return entries.map(([title, type, status, meta, offset]) => ({
    id: nextId('doc'),
    title,
    type,
    status,
    meta,
    updatedAt: daysFrom(offset),
  }))
}

function tasks(entries: [string, boolean, number, string][]): ClientTask[] {
  return entries.map(([title, done, dueOffset, assignee]) => ({
    id: nextId('task'),
    title,
    done,
    dueDate: daysFrom(dueOffset),
    assignee,
  }))
}

function updates(entries: [string, number, string][]): UpdateEntry[] {
  return entries.map(([text, offset, author]) => ({
    id: nextId('update'),
    text,
    date: daysFrom(offset),
    author,
  }))
}

function library(entries: [string, string, number][]): LibraryItem[] {
  return entries.map(([title, category, offset]) => ({
    id: nextId('lib'),
    title,
    category,
    updatedAt: daysFrom(offset),
  }))
}

function brandHub(entries: [string, BrandAsset['type'], number][]): BrandAsset[] {
  return entries.map(([title, type, offset]) => ({
    id: nextId('asset'),
    title,
    type,
    addedAt: daysFrom(offset),
  }))
}

function events(entries: [string, number][]): ClientEvent[] {
  return entries.map(([title, offset]) => ({
    id: nextId('evt'),
    title,
    date: daysFrom(offset),
  }))
}

export const CLIENTS: Client[] = [
  {
    id: 'bloom-ventures',
    name: 'Bloom Ventures',
    projectName: 'Rebrand',
    initials: 'BV',
    color: '#6a60f6',
    status: 'completed',
    owner: TEAM[0].id,
    startDate: daysFrom(-160),
    dueDate: daysFrom(-16),
    phases: buildPhases(4, 0, -160),
    workshop: fullWorkshop('approved'),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -158],
      ['Contract', 'contract', 'signed', 'Signed by all parties', -155],
      ['Invoices', 'invoice', 'paid', '£21,600 paid in full', -20],
      ['Brand Strategy', 'strategy', 'signed', 'Bloom Ventures Brand Strategy.pdf', -120],
      ['Speed Run Presentation 1', 'presentation', 'signed', 'Figma', -90],
      ['Speed Run Presentation 2', 'presentation', 'signed', 'Figma', -60],
      ['Final Brand Presentation', 'presentation', 'signed', 'Figma', -20],
      ['Figma Brand Guidelines', 'guidelines', 'signed', 'Figma', -18],
    ]),
    tasks: tasks([
      ['Send final asset pack', true, -17, TEAM[0].id],
      ['Schedule 30-day check-in call', false, 12, TEAM[0].id],
    ]),
    updates: updates([
      ['Final brand presentation delivered — client thrilled with the direction.', -18, 'Maya Chen'],
      ['Guidelines hub shared and walked through live.', -17, 'Maya Chen'],
      ['Project closed out. Invoice paid in full.', -16, 'Maya Chen'],
    ]),
    library: library([
      ['Discovery call recording', 'Recordings', -158],
      ['Competitor audit deck', 'Research', -140],
    ]),
    brandHub: brandHub([
      ['Primary logo (SVG + PNG)', 'logo', -18],
      ['Wordmark lockups', 'logo', -18],
      ['Colour palette', 'color', -18],
      ['Typography system', 'typography', -18],
      ['Full brand guidelines PDF', 'guideline', -16],
    ]),
    events: events([['30-day check-in call', 12]]),
  },
  {
    id: 'meridian-robotics',
    name: 'Meridian Robotics',
    projectName: 'Brand identity',
    initials: 'MR',
    color: '#eb6834',
    status: 'active',
    owner: TEAM[1].id,
    startDate: daysFrom(-18),
    dueDate: daysFrom(52),
    phases: buildPhases(0, 2, -18),
    workshop: partialWorkshop(1, 0),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -18],
      ['Contract', 'contract', 'signed', 'Signed by all parties', -16],
      ['Invoices', 'invoice', 'unpaid', 'First milestone due', -3],
    ]),
    tasks: tasks([
      ['Chase first milestone invoice', false, -1, CURRENT_USER.id],
      ['Send competitor research summary', false, 2, TEAM[1].id],
      ['Book strategy workshop call', false, 5, CURRENT_USER.id],
    ]),
    updates: updates([
      ['Kickoff call completed — strong alignment on direction.', -18, 'Diego Alvarez'],
      ['Questionnaire sent to client for async input.', -12, 'Diego Alvarez'],
    ]),
    library: library([['Kickoff call recording', 'Recordings', -18]]),
    brandHub: [],
    events: events([
      ['Strategy workshop call', 5],
      ['Milestone invoice due', -1],
    ]),
  },
  {
    id: 'fernwood-health',
    name: 'Fernwood Health',
    projectName: 'Rebrand',
    initials: 'FH',
    color: '#1baf7a',
    status: 'active',
    owner: TEAM[2].id,
    startDate: daysFrom(-46),
    dueDate: daysFrom(30),
    phases: buildPhases(1, 1, -46),
    workshop: partialWorkshop(5, 1),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -46],
      ['Contract', 'contract', 'signed', 'Signed by all parties', -44],
      ['Invoices', 'invoice', 'paid', 'Deposit paid in full', -44],
      ['Brand Strategy', 'strategy', 'with_you', 'Draft in progress', -2],
    ]),
    tasks: tasks([
      ['Finish brand strategy draft', false, 1, CURRENT_USER.id],
      ['Review positioning options internally', false, 3, TEAM[2].id],
    ]),
    updates: updates([
      ['Discovery workshop completed with full leadership team.', -30, 'Priya Nair'],
      ['Positioning direction narrowed to two routes.', -8, 'Priya Nair'],
    ]),
    library: library([
      ['Discovery workshop notes', 'Research', -30],
      ['Stakeholder interview summary', 'Research', -25],
    ]),
    brandHub: [],
    events: events([['Strategy sign-off call', 6]]),
  },
  {
    id: 'anchorpoint-labs',
    name: 'Anchorpoint Labs',
    projectName: 'Visual identity',
    initials: 'AL',
    color: '#e87ba4',
    status: 'active',
    owner: TEAM[3].id,
    startDate: daysFrom(-74),
    dueDate: daysFrom(10),
    phases: buildPhases(2, 2, -74),
    workshop: fullWorkshop(),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -74],
      ['Contract', 'contract', 'signed', 'Signed by all parties', -72],
      ['Invoices', 'invoice', 'unpaid', 'Final milestone outstanding', -4],
      ['Brand Strategy', 'strategy', 'signed', 'Anchorpoint Labs Brand Strategy.pdf', -50],
      ['Logo Concepts', 'presentation', 'signed', 'Figma', -20],
    ]),
    tasks: tasks([
      ['Chase final milestone invoice', false, -2, CURRENT_USER.id],
      ['Prep full identity presentation deck', false, 4, TEAM[3].id],
    ]),
    updates: updates([
      ['Logo direction approved — moving into full identity design.', -20, 'Jonah Rees'],
      ['Full identity design underway across all touchpoints.', -6, 'Jonah Rees'],
    ]),
    library: library([['Logo concept exploration', 'Design files', -22]]),
    brandHub: [],
    events: events([['Full identity presentation', 4]]),
  },
  {
    id: 'solstice-retail',
    name: 'Solstice Retail',
    projectName: 'Rebrand',
    initials: 'SR',
    color: '#eda100',
    status: 'active',
    owner: TEAM[0].id,
    startDate: daysFrom(-95),
    dueDate: daysFrom(3),
    phases: buildPhases(3, 1, -95),
    workshop: fullWorkshop(),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -95],
      ['Contract', 'contract', 'signed', 'Signed by all parties', -93],
      ['Invoices', 'invoice', 'paid', '£18,400 paid in full', -90],
      ['Brand Strategy', 'strategy', 'signed', 'Solstice Retail Brand Strategy.pdf', -70],
      ['Final Brand Presentation', 'presentation', 'with_client', 'Figma', -1],
    ]),
    tasks: tasks([
      ['Prep guidelines hub for handover', false, 2, TEAM[0].id],
      ['Follow up on final presentation feedback', false, 0, CURRENT_USER.id],
    ]),
    updates: updates([
      ['Final brand presentation sent for review.', -1, 'Maya Chen'],
    ]),
    library: library([['Retail signage mockups', 'Design files', -10]]),
    brandHub: [],
    events: events([['Final feedback call', 0]]),
  },
  {
    id: 'cedarwood-hospitality',
    name: 'Cedarwood Hospitality',
    projectName: 'Brand identity',
    initials: 'CH',
    color: '#4a3aa7',
    status: 'paused',
    owner: TEAM[1].id,
    startDate: daysFrom(-9),
    dueDate: daysFrom(80),
    phases: buildPhases(0, 1, -9),
    workshop: emptyWorkshop(),
    documents: docs([
      ['Proposal', 'proposal', 'signed', 'Figma embed', -9],
      ['Contract', 'contract', 'with_client', 'Awaiting signature', -8],
    ]),
    tasks: tasks([['Follow up on contract signature', false, -1, TEAM[1].id]]),
    updates: updates([['Kickoff call held — project paused pending internal client budget approval.', -6, 'Diego Alvarez']]),
    library: [],
    brandHub: [],
    events: [],
  },
]
