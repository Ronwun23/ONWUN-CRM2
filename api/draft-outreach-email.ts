import type { VercelRequest, VercelResponse } from '@vercel/node'

// Drafts a first cold-outreach email from the studio's brief (Setup) and
// a genuine observation about one specific lead, using Claude — same
// shape as generate-strategy.ts: a Vercel serverless function, not
// callable from the browser directly, since it needs the Anthropic key
// and the Supabase service_role key.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    // Four distinct opening lines (1-2 sentences), each a different
    // angle on the same observation — the UI lets the sender cycle
    // through them ("Try another opening, 1 of 4") without touching
    // the rest of the email.
    openings: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: { type: 'string' },
    },
    // Everything after the opening — what we do, a light call to
    // action, and a short, clear opt-out line. Written to read
    // naturally after any of the four openings.
    body: { type: 'string' },
  },
  required: ['subject', 'openings', 'body'],
}

const SYSTEM_PROMPT =
  'You are writing a first cold outreach email for a branding studio, on behalf of the person actually sending it. ' +
  "Base it strictly on the studio's brief and the genuine observation they wrote about this specific lead — never " +
  'invent details about the lead that were not given to you. Write like a real person who looked at their site, not ' +
  'a template: warm, specific, brief, no marketing jargon, no exclamation-mark energy. Four openings, each a ' +
  'genuinely different angle on the same observation (not just reworded), 1-2 sentences each. One shared body that ' +
  'reads naturally after any of them: a line on what the studio does/sells (mention price only if it was given, and ' +
  'only lightly), a low-pressure call to action, and a short, clear line making it easy to opt out of hearing from ' +
  'them again. No subject-line clickbait.'

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

interface AcquisitionProfileRow {
  niche: string
  countries: string
  who_exactly: string | null
  what_we_sell: string | null
  price: string | null
  call_days: string | null
  past_work_what: string | null
  past_work_why: string | null
}

async function fetchAcquisitionProfile(): Promise<AcquisitionProfileRow | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null

  const res = await fetch(`${supabaseUrl}/rest/v1/acquisition_profile?select=*&order=id.asc&limit=1`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  })
  if (!res.ok) return null
  const rows = (await res.json()) as AcquisitionProfileRow[]
  return rows[0] ?? null
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

  const { companyName, contactName, noticedNote, whyFits } = (req.body ?? {}) as {
    companyName?: string
    contactName?: string
    noticedNote?: string
    whyFits?: string
  }
  if (!companyName?.trim()) {
    res.status(400).json({ error: 'Missing companyName' })
    return
  }

  const profile = await fetchAcquisitionProfile()
  if (!profile) {
    res.status(400).json({ error: 'Fill in the Setup brief before drafting an email' })
    return
  }

  const briefLines = [
    `Niche we target: ${profile.niche}`,
    `Countries: ${profile.countries}`,
    profile.who_exactly && `Who exactly: ${profile.who_exactly}`,
    profile.what_we_sell && `What we sell: ${profile.what_we_sell}`,
    profile.price && `Price: ${profile.price}`,
    profile.call_days && `Days we take calls: ${profile.call_days}`,
    profile.past_work_what && `Past work in this niche — what we did: ${profile.past_work_what}`,
    profile.past_work_why && `Past work in this niche — why it was valuable: ${profile.past_work_why}`,
  ].filter(Boolean)

  const leadLines = [
    `Company: ${companyName.trim()}`,
    contactName?.trim() && `Contact name: ${contactName.trim()}`,
    noticedNote?.trim() && `What the sender noticed about them: ${noticedNote.trim()}`,
    whyFits?.trim() && `Why this lead fits the brief: ${whyFits.trim()}`,
  ].filter(Boolean)

  const userContent = `Studio brief:\n${briefLines.join('\n')}\n\nThis lead:\n${leadLines.join('\n')}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

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
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
        tools: [
          {
            name: 'submit_draft',
            description: 'Submit the drafted outreach email.',
            input_schema: DRAFT_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_draft' },
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
    res.status(502).json({ error: 'The AI service failed to draft the email' })
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
