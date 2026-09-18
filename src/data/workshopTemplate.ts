import type { WorkshopSection } from '@/types'

// The standard Onwun discovery & strategy workshop — run live with the client,
// one question at a time, with a private note field alongside each answer.
export const WORKSHOP_SECTIONS: WorkshopSection[] = [
  {
    id: 'current-state',
    title: 'Current state',
    questions: [
      {
        id: 'q-current-state',
        text: "What's the current state of the business and brand?",
        helperText: 'Get the honest, unfiltered version — not the pitch-deck version.',
      },
      {
        id: 'q-working-well',
        text: "What's working well right now?",
      },
      {
        id: 'q-not-working',
        text: "What isn't working, or feels outdated?",
      },
    ],
  },
  {
    id: 'vision-goals',
    title: 'Vision & goals',
    questions: [
      {
        id: 'q-3-year-vision',
        text: 'Where do you want the business to be in 3 years?',
      },
      {
        id: 'q-success-looks-like',
        text: 'What does success look like for this rebrand specifically?',
      },
      {
        id: 'q-launch-moment',
        text: 'Is there a launch moment or deadline driving this?',
      },
    ],
  },
  {
    id: 'audience',
    title: 'Audience',
    questions: [
      {
        id: 'q-ideal-client',
        text: 'Who is your ideal client or customer?',
      },
      {
        id: 'q-audience-cares-about',
        text: 'What do they care about most when choosing a business like yours?',
      },
    ],
  },
  {
    id: 'competitors',
    title: 'Competitors & positioning',
    questions: [
      {
        id: 'q-competitors',
        text: 'Who are your biggest competitors?',
      },
      {
        id: 'q-differentiation',
        text: 'What do you want to do differently from them?',
      },
    ],
  },
  {
    id: 'personality',
    title: 'Brand personality',
    questions: [
      {
        id: 'q-brand-as-person',
        text: 'If your brand was a person, how would you describe them?',
      },
      {
        id: 'q-admired-brands',
        text: 'Are there brands — in or outside your industry — you admire?',
      },
    ],
  },
  {
    id: 'visual-direction',
    title: 'Visual direction',
    questions: [
      {
        id: 'q-visual-attraction',
        text: "Any colours, styles, or visuals you're drawn to?",
      },
      {
        id: 'q-visual-avoid',
        text: "Anything you definitely want to avoid?",
      },
    ],
  },
]

export const WORKSHOP_QUESTION_COUNT = WORKSHOP_SECTIONS.reduce((n, s) => n + s.questions.length, 0)

export interface FlatWorkshopQuestion {
  sectionIndex: number
  questionIndex: number
  overallIndex: number
  sectionTitle: string
  question: WorkshopSection['questions'][number]
}

export const FLAT_WORKSHOP_QUESTIONS: FlatWorkshopQuestion[] = WORKSHOP_SECTIONS.flatMap((section, sectionIndex) =>
  section.questions.map((question, questionIndex) => ({
    sectionIndex,
    questionIndex,
    sectionTitle: section.title,
    question,
    overallIndex: 0,
  }))
).map((q, i) => ({ ...q, overallIndex: i }))
