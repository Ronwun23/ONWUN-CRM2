import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BrandAsset,
  Client,
  ClientDocument,
  ClientTask,
  LibraryItem,
  StrategyDraft,
  StrategyStatus,
  UpdateEntry,
  WorkshopScreen,
} from '@/types'
import { CLIENTS } from '@/data/clients'
import { synthesizeStrategy } from '@/lib/strategySynthesis'

const STORAGE_KEY = 'onwun-studio-clients-v2'

function loadInitialClients(): Client[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Client[]
  } catch {
    // fall through to mock data
  }
  return CLIENTS
}

interface AppContextValue {
  clients: Client[]
  getClient: (id: string) => Client | undefined
  addClient: (client: Client) => void
  toggleStep: (clientId: string, phaseKey: string, stepId: string) => void
  addStep: (clientId: string, phaseKey: string, title: string) => void
  toggleTask: (clientId: string, taskId: string) => void
  addTask: (clientId: string, task: ClientTask) => void
  addUpdate: (clientId: string, update: UpdateEntry) => void
  addDocument: (clientId: string, doc: ClientDocument) => void
  addLibraryItem: (clientId: string, item: LibraryItem) => void
  addBrandAsset: (clientId: string, asset: BrandAsset) => void
  saveWorkshopAnswer: (clientId: string, questionId: string, answer: string) => void
  setWorkshopPosition: (clientId: string, phaseIndex: number, screen: WorkshopScreen, questionIndex: number) => void
  startWorkshop: (clientId: string) => void
  completeWorkshop: (clientId: string) => void
  saveTranscript: (clientId: string, transcript: string) => void
  generateStrategy: (clientId: string) => void
  updateStrategy: (clientId: string, updater: (s: StrategyDraft) => StrategyDraft) => void
  setStrategyStatus: (clientId: string, status: StrategyStatus) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(loadInitialClients)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [clients])

  const updateClient = useCallback((clientId: string, patch: (c: Client) => Client) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? patch(c) : c)))
  }, [])

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients])

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [client, ...prev])
  }, [])

  const toggleStep = useCallback(
    (clientId: string, phaseKey: string, stepId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        phases: c.phases.map((phase) =>
          phase.key === phaseKey
            ? {
                ...phase,
                steps: phase.steps.map((step) =>
                  step.id === stepId
                    ? {
                        ...step,
                        done: !step.done,
                        completedAt: !step.done ? new Date().toISOString() : undefined,
                      }
                    : step
                ),
              }
            : phase
        ),
      }))
    },
    [updateClient]
  )

  const addStep = useCallback(
    (clientId: string, phaseKey: string, title: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        phases: c.phases.map((phase) =>
          phase.key === phaseKey
            ? { ...phase, steps: [...phase.steps, { id: `step-${Date.now()}`, title, done: false }] }
            : phase
        ),
      }))
    },
    [updateClient]
  )

  const toggleTask = useCallback(
    (clientId: string, taskId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      }))
    },
    [updateClient]
  )

  const addTask = useCallback(
    (clientId: string, task: ClientTask) => {
      updateClient(clientId, (c) => ({ ...c, tasks: [task, ...c.tasks] }))
    },
    [updateClient]
  )

  const addUpdate = useCallback(
    (clientId: string, update: UpdateEntry) => {
      updateClient(clientId, (c) => ({ ...c, updates: [update, ...c.updates] }))
    },
    [updateClient]
  )

  const addDocument = useCallback(
    (clientId: string, doc: ClientDocument) => {
      updateClient(clientId, (c) => ({ ...c, documents: [doc, ...c.documents] }))
    },
    [updateClient]
  )

  const addLibraryItem = useCallback(
    (clientId: string, item: LibraryItem) => {
      updateClient(clientId, (c) => ({ ...c, library: [item, ...c.library] }))
    },
    [updateClient]
  )

  const addBrandAsset = useCallback(
    (clientId: string, asset: BrandAsset) => {
      updateClient(clientId, (c) => ({ ...c, brandHub: [asset, ...c.brandHub] }))
    },
    [updateClient]
  )

  const saveWorkshopAnswer = useCallback(
    (clientId: string, questionId: string, answer: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        workshop: {
          ...c.workshop,
          answers: { ...c.workshop.answers, [questionId]: answer },
        },
      }))
    },
    [updateClient]
  )

  const setWorkshopPosition = useCallback(
    (clientId: string, phaseIndex: number, screen: WorkshopScreen, questionIndex: number) => {
      updateClient(clientId, (c) => ({
        ...c,
        workshop: {
          ...c.workshop,
          currentPhaseIndex: phaseIndex,
          currentScreen: screen,
          currentQuestionIndex: questionIndex,
        },
      }))
    },
    [updateClient]
  )

  const startWorkshop = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        workshop: {
          ...c.workshop,
          started: true,
          completed: false,
          currentPhaseIndex: 0,
          currentScreen: 'intro',
          currentQuestionIndex: 0,
        },
      }))
    },
    [updateClient]
  )

  const completeWorkshop = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => ({ ...c, workshop: { ...c.workshop, completed: true } }))
    },
    [updateClient]
  )

  const saveTranscript = useCallback(
    (clientId: string, transcript: string) => {
      updateClient(clientId, (c) => ({ ...c, workshop: { ...c.workshop, transcript } }))
    },
    [updateClient]
  )

  const generateStrategy = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        workshop: { ...c.workshop, strategy: synthesizeStrategy(c.workshop.answers, c.workshop.transcript) },
      }))
    },
    [updateClient]
  )

  const updateStrategy = useCallback(
    (clientId: string, updater: (s: StrategyDraft) => StrategyDraft) => {
      updateClient(clientId, (c) => {
        if (!c.workshop.strategy) return c
        const next = updater(c.workshop.strategy)
        return {
          ...c,
          workshop: {
            ...c.workshop,
            strategy: { ...next, status: next.status === 'ai_draft' ? 'agency_reviewed' : next.status },
          },
        }
      })
    },
    [updateClient]
  )

  const setStrategyStatus = useCallback(
    (clientId: string, status: StrategyStatus) => {
      updateClient(clientId, (c) => {
        if (!c.workshop.strategy) return c
        return { ...c, workshop: { ...c.workshop, strategy: { ...c.workshop.strategy, status } } }
      })
    },
    [updateClient]
  )

  const value = useMemo(
    () => ({
      clients,
      getClient,
      addClient,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      addDocument,
      addLibraryItem,
      addBrandAsset,
      saveWorkshopAnswer,
      setWorkshopPosition,
      startWorkshop,
      completeWorkshop,
      saveTranscript,
      generateStrategy,
      updateStrategy,
      setStrategyStatus,
    }),
    [
      clients,
      getClient,
      addClient,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      addDocument,
      addLibraryItem,
      addBrandAsset,
      saveWorkshopAnswer,
      setWorkshopPosition,
      startWorkshop,
      completeWorkshop,
      saveTranscript,
      generateStrategy,
      updateStrategy,
      setStrategyStatus,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
