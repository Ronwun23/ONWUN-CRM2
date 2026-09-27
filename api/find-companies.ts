import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAgencyUser } from './_shared/verifyAgencyUser.js'
import { fetchAcquisitionProfileRow, briefLines } from './_shared/acquisitionProfile.js'
import { getTokensUsedThisMonth, addTokensUsed, monthlyTokenBudget } from './_shared/aiUsage.js'

// Finds real companies matching the studio's brief for one country,
// using Claude's web search. Two Anthropic calls rather than one:
// forcing a specific tool_choice (needed to guarantee structured JSON
// back) disables the model's ability to call any *other* tool first —
// including web search — so a single call can't both search freely and
// return forced structured output. Call 1 researches with web search
// (tool_choice: auto); call 2 hands that research back and forces a
// structured tool call to shape it. Costs one extra call, buys reliable
// JSON instead of hoping the model volunteers it.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

const COMPANIES_SCHEMA = {
  type: 'object',
  properties: {
    companies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          companyName: { type: 'string' },
          website: { type: 'string' },
          // e.g. "Shopify" — omitted if not identifiable.
          platform: { type: 'string' },
          // A real, publicly-listed contact email — omitted if none
          // was found, never invented.
          contactEmail: { type: 'string' },
          whyFits: { type: 'string' },
        },
        required: ['companyName', 'website', 'whyFits'],
      },
    },
  },
  required: ['companies'],
}

interface CompanyResult {
  companyName: string
  website: string
  platform?: string
  contactEmail?: string
  whyFits: string
}

async function fetchSuppressedContacts(): Promise<{ email: string; companyName: string | null }[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return []

  const res = await fetch(`${supabaseUrl}/rest/v1/suppressed_contacts?select=email,company_name`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  })
  if (!res.ok) return []
  const rows = (await res.json()) as { email: string; company_name: string | null }[]
  return rows.map((r) => ({ email: r.email, companyName: r.company_name }))
}

function isSuppressed(company: CompanyResult, suppressed: { email: string; companyName: string | null }[]): boolean {
  const email = company.contactEmail?.trim().toLowerCase()
  const name = company.companyName.trim().toLowerCase()
  return suppressed.some(
    (s) => (email && s.email.toLowerCase() === email) || (s.companyName && s.companyName.toLowerCase() === name)
  )
}

interface AnthropicUsage {
  input_tokens?: number
  output_tokens?: number
}

interface AnthropicMessage {
  content?: { type: string; text?: string; input?: unknown }[]
  usage?: AnthropicUsage
}

async function callAnthropic(apiKey: string, body: Record<string, unknown>): Promise<AnthropicMessage> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic API error ${res.status}: ${detail}`)
  }
  return (await res.json()) as AnthropicMessage
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
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

  // GET is just the usage meter — lets the page show it on load without
  // spending anything. Sharing this file with the POST search below
  // keeps us under Vercel Hobby's 12-serverless-function cap; the two
  // were split out for clarity, not because they need to be separate.
  if (req.method === 'GET') {
    res.status(200).json({ tokensUsed: await getTokensUsedThisMonth(), budget: monthlyTokenBudget() })
    return
  }

  const { country } = (req.body ?? {}) as { country?: string }
  if (!country?.trim()) {
    res.status(400).json({ error: 'Missing country' })
    return
  }

  const profile = await fetchAcquisitionProfileRow()
  if (!profile) {
    res.status(400).json({ error: 'Fill in the Setup brief before searching' })
    return
  }

  const budget = monthlyTokenBudget()
  if (budget !== null) {
    const used = await getTokensUsedThisMonth()
    if (used >= budget) {
      res.status(429).json({ error: `Monthly AI token budget (${budget.toLocaleString()}) reached for this month.` })
      return
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

  const suppressed = await fetchSuppressedContacts()
  const suppressedNote = suppressed.length
    ? `Skip these companies/emails entirely, they've asked never to be contacted again: ${suppressed
        .map((s) => s.companyName || s.email)
        .join(', ')}`
    : 'No companies are currently on the suppression list.'

  let totalTokens = 0

  let research: AnthropicMessage
  try {
    research = await callAnthropic(apiKey, {
      model: MODEL,
      max_tokens: 1536,
      system:
        'You are researching real companies for a UK branding studio\'s cold outreach, using web search. Only include ' +
        'companies you actually found via search — real websites, and a contact email only if genuinely publicly ' +
        'listed (e.g. on a contact or about page). Never invent a company, website, or email. Note the platform a ' +
        "site runs on (e.g. Shopify, WordPress, Webflow) if it's identifiable. Run at most 3 searches total, then " +
        'stop and report back — aim for 4-5 good candidates, not exhaustive coverage. Keep notes on each one brief.',
      messages: [
        {
          role: 'user',
          content: `Studio brief:\n${briefLines(profile).join('\n')}\n\nSearching in: ${country.trim()}\n\n${suppressedNote}`,
        },
      ],
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    })
  } catch (err) {
    console.error('Anthropic research call failed:', err)
    res.status(502).json({ error: 'Could not reach the AI service' })
    return
  }
  totalTokens += (research.usage?.input_tokens ?? 0) + (research.usage?.output_tokens ?? 0)

  const researchText = research.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
  if (!researchText?.trim()) {
    await addTokensUsed(totalTokens)
    res.status(502).json({ error: 'The AI search returned nothing usable — try again.' })
    return
  }

  let structured: AnthropicMessage
  try {
    structured = await callAnthropic(apiKey, {
      model: MODEL,
      max_tokens: 2048,
      system:
        'Convert the research below into structured company results via the submit_companies tool. Only include ' +
        'companies with a real, findable website. Leave contactEmail out if none was found — never invent one. ' +
        "whyFits should be 1-2 sentences, mentioning the platform if it's known.",
      messages: [{ role: 'user', content: researchText }],
      tools: [{ name: 'submit_companies', description: 'Submit the structured company results.', input_schema: COMPANIES_SCHEMA }],
      tool_choice: { type: 'tool', name: 'submit_companies' },
    })
  } catch (err) {
    console.error('Anthropic structuring call failed:', err)
    await addTokensUsed(totalTokens)
    res.status(502).json({ error: 'Could not reach the AI service' })
    return
  }
  totalTokens += (structured.usage?.input_tokens ?? 0) + (structured.usage?.output_tokens ?? 0)

  const tokensUsed = await addTokensUsed(totalTokens)

  const toolUse = structured.content?.find((block) => block.type === 'tool_use')
  const companies = (toolUse?.input as { companies?: CompanyResult[] } | undefined)?.companies ?? []
  const filtered = companies.filter((c) => !isSuppressed(c, suppressed))

  res.status(200).json({ companies: filtered, tokensUsed, budget })
}
