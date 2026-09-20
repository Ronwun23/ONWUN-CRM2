export const PHASES = ['discovery', 'strategy', 'design', 'delivery'] as const
export type PhaseKey = (typeof PHASES)[number]

export const PHASE_LABELS: Record<PhaseKey, string> = {
  discovery: 'Discovery',
  strategy: 'Strategy',
  design: 'Design',
  delivery: 'Delivery',
}

export type ClientStatus = 'active' | 'paused' | 'completed'

export interface ProjectStep {
  id: string
  title: string
  done: boolean
  completedAt?: string
}

export interface ProjectPhase {
  key: PhaseKey
  steps: ProjectStep[]
}

export type DocumentType =
  | 'proposal'
  | 'contract'
  | 'invoice'
  | 'strategy'
  | 'presentation'
  | 'guidelines'
  | 'other'

export type DocumentStatus = 'with_client' | 'with_you' | 'signed' | 'paid' | 'unpaid' | 'draft'

export interface ClientDocument {
  id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  meta?: string
  url?: string
  updatedAt: string
}

export interface ClientTask {
  id: string
  title: string
  done: boolean
  dueDate: string
  assignee: string
}

export interface UpdateEntry {
  id: string
  text: string
  date: string
  author: string
}

export interface LibraryItem {
  id: string
  title: string
  category: string
  updatedAt: string
}

export type BrandAssetType = 'logo' | 'color' | 'typography' | 'guideline' | 'other'

export interface BrandAsset {
  id: string
  title: string
  type: BrandAssetType
  addedAt: string
}

export interface ClientEvent {
  id: string
  title: string
  date: string
}

export interface WorkshopQuestion {
  id: string
  text: string
}

export interface WorkshopPhase {
  id: string
  title: string
  description: string
  introHeading: string
  introBody: string
  questions: WorkshopQuestion[]
}

export type WorkshopScreen = 'intro' | 'question'

export type StrategyStatus = 'ai_draft' | 'agency_reviewed' | 'approved'

export interface BrandValue {
  name: string
  description: string
}

export interface ToneOfVoiceItem {
  tone: string
  description: string
  example: string
}

export interface CompetitorAnalysis {
  name: string
  whoTheyAre: string
  whatTheyDo: string
  positioning: string
  strengths: string
  observations: string
}

export interface AudiencePersona {
  name: string
  whoTheyAre: string
  demographics: string
  goals: string
  challenges: string
  painPoints: string
  motivations: string
  values: string
  lookingFor: string
  whyThisBrand: string
}

export interface StrategyDraft {
  status: StrategyStatus
  generatedAt: string
  transcriptUsed: string
  originStory: string
  problem: string
  solution: string
  mission: string
  vision: string
  values: BrandValue[]
  toneOfVoice: ToneOfVoiceItem[]
  competitors: CompetitorAnalysis[]
  ourPositioning: string
  marketPositioning: string
  audiencePersona: AudiencePersona
}

export interface WorkshopState {
  started: boolean
  completed: boolean
  currentPhaseIndex: number
  currentScreen: WorkshopScreen
  currentQuestionIndex: number
  answers: Record<string, string>
  transcript: string
  strategy: StrategyDraft | null
}

export interface Client {
  id: string
  name: string
  projectName: string
  initials: string
  color: string
  avatarUrl?: string
  status: ClientStatus
  owner: string
  startDate: string
  dueDate: string
  phases: ProjectPhase[]
  documents: ClientDocument[]
  tasks: ClientTask[]
  updates: UpdateEntry[]
  library: LibraryItem[]
  brandHub: BrandAsset[]
  events: ClientEvent[]
  workshop: WorkshopState
}

export interface TeamMember {
  id: string
  name: string
  initials: string
  color: string
  email: string
}
