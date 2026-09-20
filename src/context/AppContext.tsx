import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BrandAsset,
  Client,
  ClientDocument,
  ClientEvent,
  ClientTask,
  DocumentComment,
  LibraryFile,
  LibraryFolder,
  StrategyDraft,
  StrategyStatus,
  UpdateEntry,
  WorkshopScreen,
} from '@/types'
import { CLIENTS } from '@/data/clients'
import { synthesizeStrategy } from '@/lib/strategySynthesis'

const STORAGE_KEY = 'onwun-studio-clients-v3'
const STUDIO_STORAGE_KEY = 'onwun-studio-internal-v1'

function loadInitialClients(): Client[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Client[]
  } catch {
    // fall through to mock data
  }
  return CLIENTS
}

interface StudioState {
  tasks: ClientTask[]
  updates: UpdateEntry[]
  events: ClientEvent[]
  logoUrl?: string
}

function loadInitialStudio(): StudioState {
  try {
    const raw = window.localStorage.getItem(STUDIO_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StudioState
  } catch {
    // fall through to empty state
  }
  return { tasks: [], updates: [], events: [] }
}

interface AppContextValue {
  clients: Client[]
  getClient: (id: string) => Client | undefined
  addClient: (client: Client) => void
  removeClient: (clientId: string) => void
  updateClientProfile: (
    clientId: string,
    patch: Partial<
      Pick<Client, 'name' | 'projectName' | 'owner' | 'dueDate' | 'avatarUrl' | 'color' | 'initials' | 'email' | 'phone'>
    >
  ) => void
  toggleStep: (clientId: string, phaseKey: string, stepId: string) => void
  addStep: (clientId: string, phaseKey: string, title: string) => void
  toggleTask: (clientId: string, taskId: string) => void
  addTask: (clientId: string, task: ClientTask) => void
  addUpdate: (clientId: string, update: UpdateEntry) => void
  addDocument: (clientId: string, doc: ClientDocument) => void
  updateDocument: (clientId: string, docId: string, patch: Partial<ClientDocument>) => void
  removeDocument: (clientId: string, docId: string) => void
  addDocumentComment: (clientId: string, docId: string, comment: DocumentComment) => void
  addLibraryFolder: (clientId: string, folder: LibraryFolder) => void
  removeLibraryFolder: (clientId: string, folderId: string) => void
  addLibraryFile: (clientId: string, folderId: string, file: LibraryFile) => void
  removeLibraryFile: (clientId: string, folderId: string, fileId: string) => void
  addBrandAsset: (clientId: string, asset: BrandAsset) => void
  saveWorkshopAnswer: (clientId: string, questionId: string, answer: string) => void
  setWorkshopPosition: (clientId: string, phaseIndex: number, screen: WorkshopScreen, questionIndex: number) => void
  startWorkshop: (clientId: string) => void
  completeWorkshop: (clientId: string) => void
  saveTranscript: (clientId: string, transcript: string) => void
  generateStrategy: (clientId: string) => void
  updateStrategy: (clientId: string, updater: (s: StrategyDraft) => StrategyDraft) => void
  setStrategyStatus: (clientId: string, status: StrategyStatus) => void
  studio: StudioState
  addStudioTask: (task: ClientTask) => void
  toggleStudioTask: (taskId: string) => void
  addStudioUpdate: (update: UpdateEntry) => void
  addStudioEvent: (event: ClientEvent) => void
  removeStudioEvent: (eventId: string) => void
  setStudioLogo: (url: string | undefined) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(loadInitialClients)
  const [studio, setStudio] = useState<StudioState>(loadInitialStudio)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [clients])

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(studio))
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [studio])

  const addStudioTask = useCallback((task: ClientTask) => {
    setStudio((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }))
  }, [])

  const toggleStudioTask = useCallback((taskId: string) => {
    setStudio((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }))
  }, [])

  const addStudioUpdate = useCallback((update: UpdateEntry) => {
    setStudio((prev) => ({ ...prev, updates: [update, ...prev.updates] }))
  }, [])

  const addStudioEvent = useCallback((event: ClientEvent) => {
    setStudio((prev) => ({ ...prev, events: [...prev.events, event] }))
  }, [])

  const removeStudioEvent = useCallback((eventId: string) => {
    setStudio((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }))
  }, [])

  const setStudioLogo = useCallback((url: string | undefined) => {
    setStudio((prev) => ({ ...prev, logoUrl: url }))
  }, [])

  const updateClient = useCallback((clientId: string, patch: (c: Client) => Client) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? patch(c) : c)))
  }, [])

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients])

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [client, ...prev])
  }, [])

  const removeClient = useCallback((clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
  }, [])

  const updateClientProfile = useCallback(
    (clientId: string, patch: Parameters<AppContextValue['updateClientProfile']>[1]) => {
      updateClient(clientId, (c) => ({ ...c, ...patch }))
    },
    [updateClient]
  )

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

  const updateDocument = useCallback(
    (clientId: string, docId: string, patch: Partial<ClientDocument>) => {
      updateClient(clientId, (c) => ({
        ...c,
        documents: c.documents.map((d) => (d.id === docId ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
      }))
    },
    [updateClient]
  )

  const removeDocument = useCallback(
    (clientId: string, docId: string) => {
      updateClient(clientId, (c) => ({ ...c, documents: c.documents.filter((d) => d.id !== docId) }))
    },
    [updateClient]
  )

  const addDocumentComment = useCallback(
    (clientId: string, docId: string, comment: DocumentComment) => {
      updateClient(clientId, (c) => ({
        ...c,
        documents: c.documents.map((d) =>
          d.id === docId ? { ...d, comments: [...(d.comments ?? []), comment] } : d
        ),
      }))
    },
    [updateClient]
  )

  const addLibraryFolder = useCallback(
    (clientId: string, folder: LibraryFolder) => {
      updateClient(clientId, (c) => ({ ...c, library: [...c.library, folder] }))
    },
    [updateClient]
  )

  const removeLibraryFolder = useCallback(
    (clientId: string, folderId: string) => {
      updateClient(clientId, (c) => ({ ...c, library: c.library.filter((f) => f.id !== folderId) }))
    },
    [updateClient]
  )

  const addLibraryFile = useCallback(
    (clientId: string, folderId: string, file: LibraryFile) => {
      updateClient(clientId, (c) => ({
        ...c,
        library: c.library.map((folder) =>
          folder.id === folderId ? { ...folder, files: [file, ...folder.files] } : folder
        ),
      }))
    },
    [updateClient]
  )

  const removeLibraryFile = useCallback(
    (clientId: string, folderId: string, fileId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        library: c.library.map((folder) =>
          folder.id === folderId ? { ...folder, files: folder.files.filter((f) => f.id !== fileId) } : folder
        ),
      }))
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
      removeClient,
      updateClientProfile,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      addDocument,
      updateDocument,
      removeDocument,
      addDocumentComment,
      addLibraryFolder,
      removeLibraryFolder,
      addLibraryFile,
      removeLibraryFile,
      addBrandAsset,
      saveWorkshopAnswer,
      setWorkshopPosition,
      startWorkshop,
      completeWorkshop,
      saveTranscript,
      generateStrategy,
      updateStrategy,
      setStrategyStatus,
      studio,
      addStudioTask,
      toggleStudioTask,
      addStudioUpdate,
      addStudioEvent,
      removeStudioEvent,
      setStudioLogo,
    }),
    [
      clients,
      getClient,
      addClient,
      removeClient,
      updateClientProfile,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      addDocument,
      updateDocument,
      removeDocument,
      addDocumentComment,
      addLibraryFolder,
      removeLibraryFolder,
      addLibraryFile,
      removeLibraryFile,
      addBrandAsset,
      saveWorkshopAnswer,
      setWorkshopPosition,
      startWorkshop,
      completeWorkshop,
      saveTranscript,
      generateStrategy,
      updateStrategy,
      setStrategyStatus,
      studio,
      addStudioTask,
      toggleStudioTask,
      addStudioUpdate,
      addStudioEvent,
      removeStudioEvent,
      setStudioLogo,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
