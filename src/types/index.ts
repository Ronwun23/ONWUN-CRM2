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
  | 'moodboard'
  | 'identity'
  | 'guidelines'
  | 'offboarding'
  | 'other'

export type DocumentStatus = 'with_client' | 'with_you' | 'signed' | 'paid' | 'unpaid' | 'draft'

export type CommentAuthorType = 'agency' | 'client'

export interface DocumentComment {
  id: string
  authorName: string
  authorType: CommentAuthorType
  text: string
  createdAt: string
  pageLabel?: string
}

export interface DocumentTestimonial {
  text: string
  authorName: string
  authorType: CommentAuthorType
  createdAt: string
}

export interface DocumentSignature {
  authorName: string
  signatureData: string
  createdAt: string
}

export interface ClientDocument {
  id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  meta?: string
  url?: string
  updatedAt: string
  comments: DocumentComment[]
  testimonial?: DocumentTestimonial
  agencySignature?: DocumentSignature
  clientSignature?: DocumentSignature
  // Only meaningful when type is 'invoice' — status's existing 'paid'/
  // 'unpaid' values double as the invoice's payment state, so only
  // approval needs a field of its own.
  invoiceNumber?: string
  billedToName?: string
  issuedDate?: string
  dueDate?: string
  amount?: number
  invoiceApproved?: boolean
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
  authorType?: 'agency' | 'client'
  docId?: string
  docTitle?: string
}

export type LibraryFileType = 'pdf' | 'png' | 'ttf' | 'link' | 'other'

export interface LibraryFile {
  id: string
  title: string
  fileType: LibraryFileType
  fileName?: string
  url?: string
  updatedAt: string
}

export interface LibraryFolder {
  id: string
  name: string
  files: LibraryFile[]
}

export type BrandAssetType = 'logo' | 'color' | 'typography' | 'guideline' | 'other'

export interface BrandAsset {
  id: string
  title: string
  type: BrandAssetType
  addedAt: string
}

export type ContentEventType = 'shoot_day' | 'reel' | 'static' | 'story' | 'carousel'
export type ReelDuration = '0_5' | '5_10' | '10_20' | '20_plus'

export interface ClientEvent {
  id: string
  title: string
  date: string
  time?: string
  notes?: string
  // Studio-calendar organization — distinct from contentType below, which is
  // the client-facing content-deliverable type on the Content Calendar.
  category?: string
  color?: string
  tags?: string[]
  contentType?: ContentEventType
  // Only meaningful when contentType is 'reel'.
  duration?: ReelDuration
  // Only meaningful when contentType is set and isn't 'reel' — how many
  // posts of that type are planned for the day.
  amount?: number
  // A single attached image or MP4 for this task — a moodboard frame, a raw
  // clip, whatever the team needs to see alongside the plan.
  fileUrl?: string
  fileName?: string
  fileKind?: 'png' | 'jpg' | 'mp4'
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
  email?: string
  phone?: string
  status: ClientStatus
  owner: string
  startDate: string
  dueDate: string
  phases: ProjectPhase[]
  documents: ClientDocument[]
  tasks: ClientTask[]
  updates: UpdateEntry[]
  library: LibraryFolder[]
  brandHub: BrandAsset[]
  events: ClientEvent[]
  workshop: WorkshopState
  // The full project/contract value, set once by the agency — shown
  // alongside the Invoices page's Open total so both sides can see how
  // much of the total has been invoiced so far.
  invoiceTotalValue?: number
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'wants_video'
  | 'video_sent'
  | 'call_booked'
  | 'live_conversation'
  | 'not_now'
  | 'suppressed'
  | 'converted'

export type LeadSource = 'ads' | 'referral' | 'website' | 'existing_client' | 'other'

export type SequenceStepType = 'email_1' | 'call_1' | 'email_2' | 'call_2' | 'call_3' | 'email_3'

export type TouchKind = 'email_sent' | 'call_made' | 'reply_received' | 'outcome_set'

export interface SequenceStep {
  id: string
  stepType: SequenceStepType
  dueDate: string
  done: boolean
  doneAt?: string
}

export interface Touch {
  id: string
  kind: TouchKind
  note?: string
  createdAt: string
}

export interface Lead {
  id: string
  companyName: string
  website?: string
  phone?: string
  contactName?: string
  contactEmail?: string
  country?: string
  source?: LeadSource
  // AI's reasoning for the fit (Phase 3) — blank for manually-added leads.
  whyFits?: string
  // "What you noticed" — a genuine observation written by whoever's
  // reaching out, used to personalize the first email.
  noticedNote?: string
  status: LeadStatus
  owner: string
  // Set when status is 'not_now' — the lead resurfaces in the queue on
  // this date instead of staying invisible forever.
  notNowUntil?: string
  convertedClientId?: string
  createdAt: string
  updatedAt: string
  steps: SequenceStep[]
  touches: Touch[]
}

export type DealStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

export type DealPriority = 'high' | 'medium' | 'low'

// A tracked opportunity against a contact — its stage is dragged by hand
// (Kanban-style), separate from a Lead's own outreach-sequence `status`
// which automation drives.
export interface Deal {
  id: string
  title: string
  value?: number
  currency: string
  stage: DealStage
  priority: DealPriority
  contactId?: string
  contactName?: string
  contactCountry?: string
  createdAt: string
  updatedAt: string
}

// The outreach brief — one per studio — that drives AI-drafted emails
// and (Phase 3) the company search. Only niche and countries are
// required; everything else sharpens the draft without blocking it.
export interface AcquisitionProfile {
  id: string
  niche: string
  countries: string
  whoExactly?: string
  whatWeSell?: string
  price?: string
  callDays?: string
  pastWorkWhat?: string
  pastWorkWhy?: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  initials: string
  color: string
  email: string
}
