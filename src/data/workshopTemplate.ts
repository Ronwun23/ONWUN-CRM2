import type { WorkshopPhase } from '@/types'

// The Onwun discovery & strategy workshop — run one question at a time, exactly
// eight phases of four questions each. This is the source of truth for the
// client-facing workshop, the Answers review, and the AI strategy synthesis.
export const WORKSHOP_PHASES: WorkshopPhase[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'Understand the foundations and context behind the business.',
    introHeading: 'Introduction',
    introBody: "Let's get to know you and your brand.",
    questions: [
      { id: 'p1-q1', text: "What's the brand's name?" },
      { id: 'p1-q2', text: "What's your origin story?" },
      { id: 'p1-q3', text: "What's the current state of the business and brand?" },
      { id: 'p1-q4', text: 'Why did you choose your brand name?' },
    ],
  },
  {
    id: 'golden-circle',
    title: 'The Golden Circle',
    description: 'Understand who, what, how and why — the core of the business.',
    introHeading: 'The Golden Circle',
    introBody:
      'Very few organisations know why they do what they do, so this exercise allows us to understand who, what, how and why.',
    questions: [
      { id: 'p2-q1', text: 'Who are the key people you need to reach?' },
      { id: 'p2-q2', text: 'What do you actually do?' },
      { id: 'p2-q3', text: 'How do you do it differently?' },
      { id: 'p2-q4', text: 'Why does your business exist beyond making money?' },
    ],
  },
  {
    id: 'purpose-ambition',
    title: 'Purpose & Ambition',
    description: 'Understand what the brand is trying to achieve and where it wants to go.',
    introHeading: 'Purpose & Ambition',
    introBody: "Let's define what the brand is trying to achieve.",
    questions: [
      { id: 'p3-q1', text: 'What change do you want your brand to create?' },
      { id: 'p3-q2', text: 'What does success look like for your business in the next 3–5 years?' },
      { id: 'p3-q3', text: 'What do you want to be known for?' },
      { id: 'p3-q4', text: 'If everything goes right, what does your brand become?' },
    ],
  },
  {
    id: 'brand-personality',
    title: 'Brand Personality',
    description: 'Understand what the brand stands for and how it should feel.',
    introHeading: 'Brand Personality',
    introBody: "Let's define the values and personality behind the brand.",
    questions: [
      { id: 'p4-q1', text: 'What are 3–5 words you want people to associate with your brand?' },
      { id: 'p4-q2', text: 'What should your brand never feel like?' },
      { id: 'p4-q3', text: "Which brands, people or cultures feel aligned with the personality you're trying to create?" },
      { id: 'p4-q4', text: 'If your brand were a person, how would they behave in a room?' },
    ],
  },
  {
    id: 'audience',
    title: 'Audience',
    description: 'Understand who the brand is built for.',
    introHeading: 'Audience',
    introBody: "Let's understand who the brand is built for.",
    questions: [
      { id: 'p5-q1', text: 'Who is your ideal customer?' },
      { id: 'p5-q2', text: 'What problem or frustration brings them to you?' },
      { id: 'p5-q3', text: 'What are they looking for when they choose a business like yours?' },
      { id: 'p5-q4', text: 'Why should they choose you over the alternatives?' },
    ],
  },
  {
    id: 'positioning',
    title: 'Positioning',
    description: 'Understand the competitive landscape and identify where the brand can differentiate.',
    introHeading: 'Positioning',
    introBody: "Let's understand the competitive landscape and what makes the brand different.",
    questions: [
      { id: 'p6-q1', text: 'Who do you see as your main competitors or alternatives?' },
      { id: 'p6-q2', text: 'What do they do well?' },
      { id: 'p6-q3', text: 'Where do you see an opportunity to do things differently?' },
      { id: 'p6-q4', text: 'What makes your brand genuinely different?' },
    ],
  },
  {
    id: 'verbal-identity',
    title: 'Verbal Identity',
    description: 'Define how the brand should communicate.',
    introHeading: 'Verbal Identity',
    introBody: "Let's define how the brand should sound.",
    questions: [
      { id: 'p7-q1', text: 'How do you want your brand to sound?' },
      { id: 'p7-q2', text: 'What should your brand never sound like?' },
      { id: 'p7-q3', text: 'What do you want your audience to feel when they read or hear your brand?' },
      { id: 'p7-q4', text: 'Are there any brands whose communication style you admire? Why?' },
    ],
  },
  {
    id: 'the-future',
    title: 'The Future',
    description: 'Define where the brand is heading and what success looks like.',
    introHeading: 'The Future',
    introBody: "Let's define what the brand needs to become.",
    questions: [
      { id: 'p8-q1', text: 'What needs to change about your brand right now?' },
      { id: 'p8-q2', text: 'What would make this brand project a success?' },
      { id: 'p8-q3', text: 'Where do you want the brand to be 3 years from now?' },
      { id: 'p8-q4', text: "Is there anything you want us to understand that we haven't asked?" },
    ],
  },
]

export const WORKSHOP_QUESTION_COUNT = WORKSHOP_PHASES.reduce((n, p) => n + p.questions.length, 0)

export interface FlatWorkshopQuestion {
  phaseIndex: number
  questionIndex: number
  overallIndex: number
  phase: WorkshopPhase
  question: WorkshopPhase['questions'][number]
}

export const FLAT_WORKSHOP_QUESTIONS: FlatWorkshopQuestion[] = WORKSHOP_PHASES.flatMap((phase, phaseIndex) =>
  phase.questions.map((question, questionIndex) => ({
    phaseIndex,
    questionIndex,
    phase,
    question,
    overallIndex: 0,
  }))
).map((q, i) => ({ ...q, overallIndex: i }))

export function getQuestionText(id: string): string {
  return FLAT_WORKSHOP_QUESTIONS.find((q) => q.question.id === id)?.question.text ?? ''
}
