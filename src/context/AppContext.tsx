import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BrandAsset,
  Client,
  ClientDocument,
  ClientEvent,
  ClientTask,
  DocumentComment,
  DocumentTestimonial,
  LibraryFile,
  LibraryFolder,
  StrategyDraft,
  StrategyStatus,
  UpdateEntry,
  WorkshopScreen,
} from '@/types'
import { synthesizeStrategy } from '@/lib/strategySynthesis'
import { STUDIO_ACCOUNTS } from '@/data/team'
import type { StudioAccount } from '@/data/team'
import { fetchClients, insertClient, deleteClientRow, updateClientRow } from '@/lib/api/clients'
import {
  fetchDocumentsByClient,
  insertDocument,
  updateDocumentRow,
  deleteDocumentRow,
  insertComment,
} from '@/lib/api/documents'

const STUDIO_STORAGE_KEY = 'onwun-studio-internal-v1'

// Client core profile + phases + workshop, and documents (with their
// comments/testimonials), are Supabase-backed now (see src/lib/api/).
// Tasks, updates, library files, brand assets and events aren't migrated
// yet — they're still local-only state, same as before.
function syncClientFields(clientId: string, patch: Record<string, unknown>) {
  updateClientRow(clientId, patch).catch((err) => {
    console.error('Failed to save to Supabase:', err)
  })
}

function syncDocumentFields(docId: string, patch: Record<string, unknown>) {
  updateDocumentRow(docId, patch).catch((err) => {
    console.error('Failed to save document to Supabase:', err)
  })
}

interface StudioState {
  tasks: ClientTask[]
  updates: UpdateEntry[]
  events: ClientEvent[]
  logoUrl?: string
  activeAccountId?: string
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
  clientsLoading: boolean
  getClient: (id: string) => Client | undefined
  addClient: (client: Client) => Promise<Client>
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
  removeUpdate: (clientId: string, updateId: string) => void
  addDocument: (clientId: string, doc: ClientDocument) => Promise<ClientDocument>
  updateDocument: (clientId: string, docId: string, patch: Partial<ClientDocument>) => void
  removeDocument: (clientId: string, docId: string) => void
  addDocumentComment: (clientId: string, docId: string, comment: DocumentComment) => void
  setDocumentTestimonial: (clientId: string, docId: string, testimonial: DocumentTestimonial) => void
  removeDocumentTestimonial: (clientId: string, docId: string) => void
  addLibraryFolder: (clientId: string, folder: LibraryFolder) => void
  removeLibraryFolder: (clientId: string, folderId: string) => void
  addLibraryFile: (clientId: string, folderId: string, file: LibraryFile) => void
  removeLibraryFile: (clientId: string, folderId: string, fileId: string) => void
  addBrandAsset: (clientId: string, asset: BrandAsset) => void
  addClientEvent: (clientId: string, event: ClientEvent) => void
  removeClientEvent: (clientId: string, eventId: string) => void
  updateClientEventNotes: (clientId: string, eventId: string, notes: string) => void
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
  removeStudioUpdate: (updateId: string) => void
  addStudioEvent: (event: ClientEvent) => void
  removeStudioEvent: (eventId: string) => void
  setStudioLogo: (url: string | undefined) => void
  updateStudioEventNotes: (eventId: string, notes: string) => void
  activeAccount: StudioAccount
  setActiveAccount: (accountId: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [studio, setStudio] = useState<StudioState>(loadInitialStudio)

  useEffect(() => {
    Promise.all([fetchClients(), fetchDocumentsByClient()])
      .then(([loadedClients, documentsByClient]) => {
        setClients(loadedClients.map((c) => ({ ...c, documents: documentsByClient[c.id] ?? [] })))
      })
      .catch((err) => console.error('Failed to load clients from Supabase:', err))
      .finally(() => setClientsLoading(false))
  }, [])

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

  const removeStudioUpdate = useCallback((updateId: string) => {
    setStudio((prev) => ({ ...prev, updates: prev.updates.filter((u) => u.id !== updateId) }))
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

  const updateStudioEventNotes = useCallback((eventId: string, notes: string) => {
    setStudio((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === eventId ? { ...e, notes: notes || undefined } : e)),
    }))
  }, [])

  const activeAccount =
    STUDIO_ACCOUNTS.find((a) => a.id === studio.activeAccountId) ?? STUDIO_ACCOUNTS[STUDIO_ACCOUNTS.length - 1]

  const setActiveAccount = useCallback((accountId: string) => {
    setStudio((prev) => ({ ...prev, activeAccountId: accountId }))
  }, [])

  const updateClient = useCallback((clientId: string, patch: (c: Client) => Client) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? patch(c) : c)))
  }, [])

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients])

  const addClient = useCallback(async (client: Client) => {
    const created = await insertClient(client)
    // Persist the starter document checklist (Proposal, Contract, etc.) too,
    // rather than leaving it as local-only state that vanishes on refresh.
    const documents = await Promise.all(client.documents.map((doc) => insertDocument(created.id, doc)))
    const finalClient = { ...created, documents }
    setClients((prev) => [finalClient, ...prev])
    return finalClient
  }, [])

  const removeClient = useCallback((clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
    deleteClientRow(clientId).catch((err) => console.error('Failed to delete client from Supabase:', err))
  }, [])

  const updateClientProfile = useCallback(
    (clientId: string, patch: Parameters<AppContextValue['updateClientProfile']>[1]) => {
      updateClient(clientId, (c) => ({ ...c, ...patch }))
      syncClientFields(clientId, {
        name: patch.name,
        project_name: patch.projectName,
        owner: patch.owner,
        due_date: patch.dueDate,
        avatar_url: patch.avatarUrl,
        color: patch.color,
        initials: patch.initials,
        email: patch.email,
        phone: patch.phone,
      })
    },
    [updateClient]
  )

  const toggleStep = useCallback(
    (clientId: string, phaseKey: string, stepId: string) => {
      updateClient(clientId, (c) => {
        const phases = c.phases.map((phase) =>
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
        )
        syncClientFields(clientId, { phases })
        return { ...c, phases }
      })
    },
    [updateClient]
  )

  const addStep = useCallback(
    (clientId: string, phaseKey: string, title: string) => {
      updateClient(clientId, (c) => {
        const phases = c.phases.map((phase) =>
          phase.key === phaseKey
            ? { ...phase, steps: [...phase.steps, { id: `step-${Date.now()}`, title, done: false }] }
            : phase
        )
        syncClientFields(clientId, { phases })
        return { ...c, phases }
      })
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

  const removeUpdate = useCallback(
    (clientId: string, updateId: string) => {
      updateClient(clientId, (c) => ({ ...c, updates: c.updates.filter((u) => u.id !== updateId) }))
    },
    [updateClient]
  )

  const addDocument = useCallback(async (clientId: string, doc: ClientDocument) => {
    const created = await insertDocument(clientId, doc)
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, documents: [created, ...c.documents] } : c))
    )
    return created
  }, [])

  const updateDocument = useCallback(
    (clientId: string, docId: string, patch: Partial<ClientDocument>) => {
      const updatedAt = new Date().toISOString()
      updateClient(clientId, (c) => ({
        ...c,
        documents: c.documents.map((d) => (d.id === docId ? { ...d, ...patch, updatedAt } : d)),
      }))
      syncDocumentFields(docId, {
        title: patch.title,
        type: patch.type,
        status: patch.status,
        meta: patch.meta ?? null,
        url: patch.url ?? null,
        updated_at: updatedAt,
      })
    },
    [updateClient]
  )

  const removeDocument = useCallback(
    (clientId: string, docId: string) => {
      updateClient(clientId, (c) => ({ ...c, documents: c.documents.filter((d) => d.id !== docId) }))
      deleteDocumentRow(docId).catch((err) => console.error('Failed to delete document from Supabase:', err))
    },
    [updateClient]
  )

  const addDocumentComment = useCallback(
    (clientId: string, docId: string, comment: DocumentComment) => {
      updateClient(clientId, (c) => {
        const doc = c.documents.find((d) => d.id === docId)
        return {
          ...c,
          documents: c.documents.map((d) =>
            d.id === docId ? { ...d, comments: [...(d.comments ?? []), comment] } : d
          ),
          // Every document comment also drops into the updates feed, so a
          // client's (or our own) feedback on a proposal/design surfaces
          // without anyone having to open that document to notice it.
          updates: [
            {
              id: `update-comment-${comment.id}`,
              text: comment.text,
              date: comment.createdAt,
              author: comment.authorName,
              authorType: comment.authorType,
              docId,
              docTitle: doc?.title,
            },
            ...c.updates,
          ],
        }
      })
      insertComment(docId, comment).catch((err) => console.error('Failed to save comment to Supabase:', err))
    },
    [updateClient]
  )

  const setDocumentTestimonial = useCallback(
    (clientId: string, docId: string, testimonial: DocumentTestimonial) => {
      updateClient(clientId, (c) => {
        const doc = c.documents.find((d) => d.id === docId)
        return {
          ...c,
          documents: c.documents.map((d) => (d.id === docId ? { ...d, testimonial } : d)),
          // A testimonial is a moment worth the agency noticing immediately,
          // same as a comment would be.
          updates: [
            {
              id: `update-testimonial-${docId}-${testimonial.createdAt}`,
              text: testimonial.text,
              date: testimonial.createdAt,
              author: testimonial.authorName,
              authorType: testimonial.authorType,
              docId,
              docTitle: doc?.title,
            },
            ...c.updates,
          ],
        }
      })
      syncDocumentFields(docId, {
        testimonial_text: testimonial.text,
        testimonial_author_name: testimonial.authorName,
        testimonial_author_type: testimonial.authorType,
        testimonial_created_at: testimonial.createdAt,
      })
    },
    [updateClient]
  )

  const removeDocumentTestimonial = useCallback(
    (clientId: string, docId: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        documents: c.documents.map((d) => (d.id === docId ? { ...d, testimonial: undefined } : d)),
      }))
      syncDocumentFields(docId, {
        testimonial_text: null,
        testimonial_author_name: null,
        testimonial_author_type: null,
        testimonial_created_at: null,
      })
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

  const addClientEvent = useCallback(
    (clientId: string, event: ClientEvent) => {
      updateClient(clientId, (c) => ({ ...c, events: [...c.events, event] }))
    },
    [updateClient]
  )

  const removeClientEvent = useCallback(
    (clientId: string, eventId: string) => {
      updateClient(clientId, (c) => ({ ...c, events: c.events.filter((e) => e.id !== eventId) }))
    },
    [updateClient]
  )

  const updateClientEventNotes = useCallback(
    (clientId: string, eventId: string, notes: string) => {
      updateClient(clientId, (c) => ({
        ...c,
        events: c.events.map((e) => (e.id === eventId ? { ...e, notes: notes || undefined } : e)),
      }))
    },
    [updateClient]
  )

  const saveWorkshopAnswer = useCallback(
    (clientId: string, questionId: string, answer: string) => {
      updateClient(clientId, (c) => {
        const workshop = { ...c.workshop, answers: { ...c.workshop.answers, [questionId]: answer } }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const setWorkshopPosition = useCallback(
    (clientId: string, phaseIndex: number, screen: WorkshopScreen, questionIndex: number) => {
      updateClient(clientId, (c) => {
        const workshop = {
          ...c.workshop,
          currentPhaseIndex: phaseIndex,
          currentScreen: screen,
          currentQuestionIndex: questionIndex,
        }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const startWorkshop = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => {
        const workshop = {
          ...c.workshop,
          started: true,
          completed: false,
          currentPhaseIndex: 0,
          currentScreen: 'intro' as const,
          currentQuestionIndex: 0,
        }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const completeWorkshop = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => {
        const workshop = { ...c.workshop, completed: true }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const saveTranscript = useCallback(
    (clientId: string, transcript: string) => {
      updateClient(clientId, (c) => {
        const workshop = { ...c.workshop, transcript }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const generateStrategy = useCallback(
    (clientId: string) => {
      updateClient(clientId, (c) => {
        const workshop = { ...c.workshop, strategy: synthesizeStrategy(c.workshop.answers, c.workshop.transcript) }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const updateStrategy = useCallback(
    (clientId: string, updater: (s: StrategyDraft) => StrategyDraft) => {
      updateClient(clientId, (c) => {
        if (!c.workshop.strategy) return c
        const next = updater(c.workshop.strategy)
        const workshop = {
          ...c.workshop,
          strategy: { ...next, status: next.status === 'ai_draft' ? ('agency_reviewed' as const) : next.status },
        }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const setStrategyStatus = useCallback(
    (clientId: string, status: StrategyStatus) => {
      updateClient(clientId, (c) => {
        if (!c.workshop.strategy) return c
        const workshop = { ...c.workshop, strategy: { ...c.workshop.strategy, status } }
        syncClientFields(clientId, { workshop })
        return { ...c, workshop }
      })
    },
    [updateClient]
  )

  const value = useMemo(
    () => ({
      clients,
      clientsLoading,
      getClient,
      addClient,
      removeClient,
      updateClientProfile,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      removeUpdate,
      addDocument,
      updateDocument,
      removeDocument,
      addDocumentComment,
      setDocumentTestimonial,
      removeDocumentTestimonial,
      addLibraryFolder,
      removeLibraryFolder,
      addLibraryFile,
      removeLibraryFile,
      addBrandAsset,
      addClientEvent,
      removeClientEvent,
      updateClientEventNotes,
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
      removeStudioUpdate,
      addStudioEvent,
      removeStudioEvent,
      setStudioLogo,
      updateStudioEventNotes,
      activeAccount,
      setActiveAccount,
    }),
    [
      clients,
      clientsLoading,
      getClient,
      addClient,
      removeClient,
      updateClientProfile,
      toggleStep,
      addStep,
      toggleTask,
      addTask,
      addUpdate,
      removeUpdate,
      addDocument,
      updateDocument,
      removeDocument,
      addDocumentComment,
      setDocumentTestimonial,
      removeDocumentTestimonial,
      addLibraryFolder,
      removeLibraryFolder,
      addLibraryFile,
      removeLibraryFile,
      addBrandAsset,
      addClientEvent,
      removeClientEvent,
      updateClientEventNotes,
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
      removeStudioUpdate,
      addStudioEvent,
      removeStudioEvent,
      setStudioLogo,
      updateStudioEventNotes,
      activeAccount,
      setActiveAccount,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
