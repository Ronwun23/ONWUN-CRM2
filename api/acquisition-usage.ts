import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAgencyUser } from './_shared/verifyAgencyUser'
import { getTokensUsedThisMonth, monthlyTokenBudget } from './_shared/aiUsage'

// Lets the Find Companies page show the token meter on load, without
// needing to run a search first.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

  const tokensUsed = await getTokensUsedThisMonth()
  res.status(200).json({ tokensUsed, budget: monthlyTokenBudget() })
}
