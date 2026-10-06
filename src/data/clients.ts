import type { Client, ClientDocument, LibraryFolder, PhaseKey, ProjectPhase, WorkshopState } from '@/types'
import { PHASES } from '@/types'
import { initialsFromName } from '@/lib/names'

const STEP_TEMPLATES: Record<PhaseKey, string[]> = {
  discovery: ['Kickoff call', 'Brand questionnaire', 'Competitor research', 'Discovery summary'],
  strategy: ['Brand strategy doc', 'Positioning workshop', 'Strategy sign-off'],
  design: ['Moodboard & direction', 'Logo concepts', 'Logo refinement', 'Full brand identity design'],
  delivery: ['Final brand presentation', 'Brand guidelines hub', 'Handover: logo pack, fonts, presentation'],
}

let stepCounter = 0
let uid = 0
const nextId = (prefix: string) => `${prefix}-${++uid}`

export function emptyWorkshop(): WorkshopState {
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

export const NEW_CLIENT_COLORS = ['#6a60f6', '#eb6834', '#1baf7a', '#e87ba4', '#eda100', '#4a3aa7']

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
    { id: nextId('doc'), title: 'Proposal', type: 'proposal', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Contract', type: 'contract', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Invoices', type: 'invoice', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Brand Strategy', type: 'strategy', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Speed Run Presentation 1', type: 'moodboard', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Speed Run Presentation 2', type: 'identity', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Final Brand Presentation', type: 'presentation', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Figma Brand Guidelines', type: 'guidelines', status: 'draft', updatedAt: now, comments: [] },
    { id: nextId('doc'), title: 'Offboarding', type: 'offboarding', status: 'draft', updatedAt: now, comments: [] },
  ]
}

// Every client's library starts with the same standard folders for the
// individual brand assets a client would want to grab on their own —
// starting empty and filled in as final files are ready.
export function blankLibraryFolders(): LibraryFolder[] {
  return ['Logos', 'Typography', 'Colour', 'Guidelines'].map((name) => ({
    id: nextId('folder'),
    name,
    files: [],
  }))
}

export function createBlankClient(input: {
  name: string
  projectName: string
  owner: string
  dueDate: string
  color?: string
  avatarUrl?: string
  email?: string
  phone?: string
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
    color: input.color ?? NEW_CLIENT_COLORS[Math.floor(Math.random() * NEW_CLIENT_COLORS.length)],
    avatarUrl: input.avatarUrl,
    email: input.email,
    phone: input.phone,
    status: 'active',
    owner: input.owner,
    startDate: new Date().toISOString(),
    dueDate: input.dueDate,
    phases: blankPhases(),
    documents: blankDocuments(),
    tasks: [],
    updates: [],
    library: blankLibraryFolders(),
    brandHub: [],
    events: [],
    workshop: emptyWorkshop(),
  }
}
