import { supabase } from '@/lib/supabase'

export interface CompanyResult {
  companyName: string
  website: string
  platform?: string
  contactEmail?: string
  whyFits: string
}

export interface UsageMeter {
  tokensUsed: number
  budget: number | null
}

async function authHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')
  return `Bearer ${session.access_token}`
}

export async function fetchAcquisitionUsage(): Promise<UsageMeter> {
  const res = await fetch('/api/acquisition-usage', {
    headers: { authorization: await authHeader() },
  })
  if (!res.ok) throw new Error(`Failed to load usage (${res.status})`)
  return (await res.json()) as UsageMeter
}

export async function findCompanies(country: string): Promise<{ companies: CompanyResult[] } & UsageMeter> {
  const res = await fetch('/api/find-companies', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: await authHeader(),
    },
    body: JSON.stringify({ country }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? `Search failed (${res.status})`)
  }

  return (await res.json()) as { companies: CompanyResult[] } & UsageMeter
}
