import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FLAT_WORKSHOP_QUESTIONS } from '../src/data/workshopTemplate'

// Turns a completed discovery workshop into a first-draft brand strategy
// using Claude, instead of the old deterministic template
// (src/lib/strategySynthesis.ts, now removed) that just reassembled the
// client's own words. Lives as a Vercel serverless function — not callable
// from the browser directly — because it needs the Anthropic API key and
// the Supabase service_role key, neither of which can safely exist in
// client-side code (anything shipped to the browser is public).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

const QUESTION_TEXT: Record<string, string> = Object.fromEntries(
  FLAT_WORKSHOP_QUESTIONS.map((q) => [q.question.id, q.question.text])
)

// Mirrors StrategyDraft (src/types/index.ts) minus the three fields the
// client fills in itself (status, generatedAt, transcriptUsed) — forced as
// a tool call so the response is always exactly this shape, never prose
// that needs fragile parsing.
const STRATEGY_SCHEMA = {
  type: 'object',
  properties: {
    originStory: { type: 'string' },
    problem: { type: 'string' },
    solution: { type: 'string' },
    mission: { type: 'string' },
    vision: { type: 'string' },
    values: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, description: { type: 'string' } },
        required: ['name', 'description'],
      },
    },
    toneOfVoice: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          tone: { type: 'string' },
          description: { type: 'string' },
          example: { type: 'string' },
        },
        required: ['tone', 'description', 'example'],
      },
    },
    competitors: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          whoTheyAre: { type: 'string' },
          whatTheyDo: { type: 'string' },
          positioning: { type: 'string' },
          strengths: { type: 'string' },
          observations: { type: 'string' },
        },
        required: ['name', 'whoTheyAre', 'whatTheyDo', 'positioning', 'strengths', 'observations'],
      },
    },
    ourPositioning: { type: 'string' },
    marketPositioning: { type: 'string' },
    audiencePersona: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        whoTheyAre: { type: 'string' },
        demographics: { type: 'string' },
        goals: { type: 'string' },
        challenges: { type: 'string' },
        painPoints: { type: 'string' },
        motivations: { type: 'string' },
        values: { type: 'string' },
        lookingFor: { type: 'string' },
        whyThisBrand: { type: 'string' },
      },
      required: [
        'name',
        'whoTheyAre',
        'demographics',
        'goals',
        'challenges',
        'painPoints',
        'motivations',
        'values',
        'lookingFor',
        'whyThisBrand',
      ],
    },
  },
  required: [
    'originStory',
    'problem',
    'solution',
    'mission',
    'vision',
    'values',
    'toneOfVoice',
    'competitors',
    'ourPositioning',
    'marketPositioning',
    'audiencePersona',
  ],
}

const SYSTEM_PROMPT =
  "You are a senior brand strategist writing a first-draft brand strategy from a client's discovery workshop answers. " +
  "Base every field strictly on what the client actually said — never invent names, numbers, or specifics they didn't give you. " +
  'If the answers genuinely don\'t give you enough to work with for a field, write exactly "Further discovery required." for ' +
  'that field rather than guessing or padding it out. Write in clear, confident, jargon-free language — the kind a real ' +
  'strategist would put in front of a paying client, not marketing fluff.'

async function verifyAgencyUser(accessToken: string): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceKey) return false

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
  })
  if (!userRes.ok) return false
  const user = (await userRes.json()) as { id?: string }
  if (!user.id) return false

  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  })
  if (!profileRes.ok) return false
  const profiles = (await profileRes.json()) as { role?: string }[]
  return profiles[0]?.role === 'agency'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }

  const isAgency = await verifyAgencyUser(authHeader.slice('Bearer '.length))
  if (!isAgency) {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const { answers, transcript } = (req.body ?? {}) as { answers?: Record<string, string>; transcript?: string }
  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ error: 'Missing answers' })
    return
  }

  const qa = Object.entries(QUESTION_TEXT)
    .filter(([id]) => answers[id]?.trim())
    .map(([id, text]) => `Q: ${text}\nA: ${answers[id].trim()}`)
    .join('\n\n')

  if (!qa) {
    res.status(400).json({ error: 'No answers to work from yet' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

  const userContent = transcript?.trim()
    ? `Discovery workshop answers:\n\n${qa}\n\nMeeting transcript (extra colour only, not the primary source):\n${transcript.trim()}`
    : `Discovery workshop answers:\n\n${qa}`

  let anthropicRes: Response
  try {
    anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
        tools: [
          {
            name: 'submit_strategy',
            description: 'Submit the completed brand strategy draft.',
            input_schema: STRATEGY_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_strategy' },
      }),
    })
  } catch (err) {
    console.error('Anthropic request failed:', err)
    res.status(502).json({ error: 'Could not reach the AI service' })
    return
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => '')
    console.error('Anthropic API error:', anthropicRes.status, detail)
    res.status(502).json({ error: 'The AI service failed to generate a draft' })
    return
  }

  const data = (await anthropicRes.json()) as { content?: { type: string; input?: unknown }[] }
  const toolUse = data.content?.find((block) => block.type === 'tool_use')
  if (!toolUse?.input) {
    res.status(502).json({ error: 'The AI service returned an unexpected response' })
    return
  }

  res.status(200).json(toolUse.input)
}
