import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAgencyUser } from './_shared/verifyAgencyUser.js'
import { fetchAcquisitionProfileRow, briefLines } from './_shared/acquisitionProfile.js'

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

  const profile = await fetchAcquisitionProfileRow()
  if (!profile) {
    res.status(400).json({ error: 'Fill in the Setup brief before drafting an email' })
    return
  }

  const leadLines = [
    `Company: ${companyName.trim()}`,
    contactName?.trim() && `Contact name: ${contactName.trim()}`,
    noticedNote?.trim() && `What the sender noticed about them: ${noticedNote.trim()}`,
    whyFits?.trim() && `Why this lead fits the brief: ${whyFits.trim()}`,
  ].filter((line): line is string => Boolean(line))

  const userContent = `Studio brief:\n${briefLines(profile).join('\n')}\n\nThis lead:\n${leadLines.join('\n')}`

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
