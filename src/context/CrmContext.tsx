import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Activity, Lead, Stage } from '@/types'
import { MOCK_LEADS } from '@/data/mockLeads'

const STORAGE_KEY = 'onwun-crm-leads-v1'

function loadInitialLeads(): Lead[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Lead[]
  } catch {
    // fall through to mock data
  }
  return MOCK_LEADS
}

interface CrmContextValue {
  leads: Lead[]
  updateLeadStage: (leadId: string, stage: Stage) => void
  addLead: (lead: Lead) => void
  updateLead: (leadId: string, patch: Partial<Lead>) => void
  deleteLead: (leadId: string) => void
  addActivity: (leadId: string, activity: Activity) => void
  resetToMockData: () => void
}

const CrmContext = createContext<CrmContextValue | null>(null)

export function CrmProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(loadInitialLeads)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [leads])

  const updateLeadStage = useCallback((leadId: string, stage: Stage) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage,
              lastActivityAt: new Date().toISOString(),
              closeDate: stage === 'won' || stage === 'lost' ? new Date().toISOString() : lead.closeDate,
              activities: [
                ...lead.activities,
                {
                  id: `act-${Date.now()}`,
                  type: 'stage_change',
                  text: `Stage moved to ${stage}.`,
                  date: new Date().toISOString(),
                },
              ],
            }
          : lead
      )
    )
  }, [])

  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => [lead, ...prev])
  }, [])

  const updateLead = useCallback((leadId: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, ...patch } : lead)))
  }, [])

  const deleteLead = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
  }, [])

  const addActivity = useCallback((leadId: string, activity: Activity) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, activities: [...lead.activities, activity], lastActivityAt: activity.date }
          : lead
      )
    )
  }, [])

  const resetToMockData = useCallback(() => {
    setLeads(MOCK_LEADS)
  }, [])

  const value = useMemo(
    () => ({ leads, updateLeadStage, addLead, updateLead, deleteLead, addActivity, resetToMockData }),
    [leads, updateLeadStage, addLead, updateLead, deleteLead, addActivity, resetToMockData]
  )

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm must be used within a CrmProvider')
  return ctx
}
