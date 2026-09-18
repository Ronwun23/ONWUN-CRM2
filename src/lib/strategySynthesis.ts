import type { AudiencePersona, BrandValue, CompetitorAnalysis, StrategyDraft, ToneOfVoiceItem } from '@/types'

// Deterministic first-draft synthesis, built entirely from the client's own
// workshop answers (and an optional meeting transcript for extra colour).
// It does not call an external model — there's no backend/API-key layer in
// this app to do that safely — so it composes a structured draft from what
// the client actually said, and is explicit when there isn't enough to work
// with rather than inventing detail.

const NEEDS_MORE = 'Further discovery required.'

function clean(text: string | undefined): string {
  return (text ?? '').trim()
}

function has(text: string | undefined): boolean {
  return clean(text).length > 0
}

function joinSentences(...parts: (string | undefined)[]): string {
  const filtered = parts.map(clean).filter(Boolean)
  if (filtered.length === 0) return NEEDS_MORE
  return filtered
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(' ')
}

function splitList(text: string | undefined, max: number): string[] {
  const t = clean(text)
  if (!t) return []
  return t
    .split(/,| and |\/|\n|;/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildValues(traitsRaw: string | undefined, neverFeel: string | undefined, brandAsPerson: string | undefined): BrandValue[] {
  const traits = splitList(traitsRaw, 4)
  const values: BrandValue[] = []
  for (let i = 0; i < 4; i++) {
    const trait = traits[i]
    if (!trait) {
      values.push({ name: NEEDS_MORE, description: NEEDS_MORE })
      continue
    }
    const name = titleCase(trait)
    const contrast = has(neverFeel) ? ` It draws a clear line against ever feeling ${clean(neverFeel).toLowerCase()}.` : ''
    const behaviour = has(brandAsPerson) ? ` In practice, that shows up the way described: ${clean(brandAsPerson)}` : ''
    values.push({
      name,
      description: `The brand is ${trait.toLowerCase()} — this should shape tone, decisions and how the team shows up.${contrast}${behaviour}`.trim(),
    })
  }
  return values
}

function buildToneOfVoice(soundRaw: string | undefined, neverSound: string | undefined, feel: string | undefined, brandName: string | undefined): ToneOfVoiceItem[] {
  const traits = splitList(soundRaw, 4)
  const items: ToneOfVoiceItem[] = []
  const name = has(brandName) ? clean(brandName) : 'The brand'
  for (let i = 0; i < 4; i++) {
    const trait = traits[i]
    if (!trait) {
      items.push({ tone: NEEDS_MORE, description: NEEDS_MORE, example: NEEDS_MORE })
      continue
    }
    const tone = titleCase(trait)
    const avoid = has(neverSound) ? ` Never ${clean(neverSound).toLowerCase()}.` : ''
    const feeling = has(feel) ? ` The goal is for the audience to feel ${clean(feel).toLowerCase()}.` : ''
    items.push({
      tone,
      description: `${name} communicates in a way that is ${trait.toLowerCase()}.${avoid}${feeling}`.trim(),
      example: `"That's exactly the kind of detail we'd want you to notice." — written in a ${trait.toLowerCase()} register.`,
    })
  }
  return items
}

function buildCompetitors(namesRaw: string | undefined, doWell: string | undefined, opportunity: string | undefined): CompetitorAnalysis[] {
  const names = splitList(namesRaw, 2)
  const competitors: CompetitorAnalysis[] = []
  for (let i = 0; i < 2; i++) {
    const name = names[i]
    if (!name) {
      competitors.push({
        name: NEEDS_MORE,
        whoTheyAre: NEEDS_MORE,
        whatTheyDo: NEEDS_MORE,
        positioning: NEEDS_MORE,
        strengths: NEEDS_MORE,
        observations: NEEDS_MORE,
      })
      continue
    }
    competitors.push({
      name,
      whoTheyAre: `Named by the client as a competitor or alternative in this space.`,
      whatTheyDo: has(doWell) ? clean(doWell) : NEEDS_MORE,
      positioning: has(doWell) ? `Competes primarily on: ${clean(doWell)}` : NEEDS_MORE,
      strengths: has(doWell) ? clean(doWell) : NEEDS_MORE,
      observations: has(opportunity) ? clean(opportunity) : NEEDS_MORE,
    })
  }
  return competitors
}

function buildPersona(
  idealCustomer: string | undefined,
  problem: string | undefined,
  lookingFor: string | undefined,
  whyChoose: string | undefined
): AudiencePersona {
  const archetype = has(idealCustomer) ? clean(idealCustomer).split(/[,.]/)[0].trim() : NEEDS_MORE
  return {
    name: archetype || NEEDS_MORE,
    whoTheyAre: has(idealCustomer) ? clean(idealCustomer) : NEEDS_MORE,
    demographics: NEEDS_MORE,
    goals: has(lookingFor) ? clean(lookingFor) : NEEDS_MORE,
    challenges: has(problem) ? clean(problem) : NEEDS_MORE,
    painPoints: has(problem) ? clean(problem) : NEEDS_MORE,
    motivations: has(lookingFor) ? clean(lookingFor) : NEEDS_MORE,
    values: has(lookingFor) ? clean(lookingFor) : NEEDS_MORE,
    lookingFor: has(lookingFor) ? clean(lookingFor) : NEEDS_MORE,
    whyThisBrand: has(whyChoose) ? clean(whyChoose) : NEEDS_MORE,
  }
}

export function synthesizeStrategy(answers: Record<string, string>, transcript: string): StrategyDraft {
  const a = (id: string) => answers[id]

  const originStory = joinSentences(
    has(a('p1-q1')) ? `${clean(a('p1-q1'))} began with a clear starting point.` : undefined,
    a('p1-q2'),
    a('p1-q4')
  )

  const problem = joinSentences(a('p5-q2'), a('p6-q3'))

  const solution = joinSentences(a('p2-q2'), a('p2-q3'), a('p5-q4'))

  const mission = joinSentences(a('p3-q1'), a('p2-q4'))

  const vision = joinSentences(a('p3-q2'), a('p8-q3'), a('p3-q4'))

  const values = buildValues(a('p4-q1'), a('p4-q2'), a('p4-q4'))

  const toneOfVoice = buildToneOfVoice(a('p7-q1'), a('p7-q2'), a('p7-q3'), a('p1-q1'))

  const competitors = buildCompetitors(a('p6-q1'), a('p6-q2'), a('p6-q3'))

  const ourPositioning = joinSentences(a('p6-q4'), a('p5-q1'), a('p2-q3'))

  const marketPositioning = joinSentences(
    has(a('p6-q1')) ? `The market includes ${clean(a('p6-q1'))}.` : undefined,
    a('p6-q2'),
    a('p6-q3')
  )

  const audiencePersona = buildPersona(a('p5-q1'), a('p5-q2'), a('p5-q3'), a('p5-q4'))

  return {
    status: 'ai_draft',
    generatedAt: new Date().toISOString(),
    transcriptUsed: clean(transcript),
    originStory,
    problem,
    solution,
    mission,
    vision,
    values,
    toneOfVoice,
    competitors,
    ourPositioning,
    marketPositioning,
    audiencePersona,
  }
}
