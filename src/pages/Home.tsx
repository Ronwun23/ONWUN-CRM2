import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ListTodo, Plus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import ClientForm from '@/components/ClientForm'
import { ClientAvatar } from '@/components/Avatar'
import { PHASES } from '@/types'
import type { Client } from '@/types'
import { phaseStatus, overallProgress } from '@/lib/progress'
import { formatDueDate } from '@/lib/format'
import { toDisplayDate, todayCivil } from '@/lib/civilDate'
import clsx from 'clsx'

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

// A small black/grey segment strip mirroring PhaseTrack, but restyled for
// this page's monochrome look — kept local rather than changing the shared
// PhaseTrack component, since other not-yet-redesigned pages still use its
// original brand-purple styling.
function PhaseSegments({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-1">
      {PHASES.map((key) => {
        const phase = client.phases.find((p) => p.key === key)!
        const status = phaseStatus(phase)
        return (
          <div
            key={key}
            className={clsx('h-1.5 w-6 rounded-full', status === 'not_started' ? 'bg-black/10' : 'bg-ink-primary')}
          />
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const { clients, studio, activeAccount, ensureClientDataLoaded } = useApp()
  const navigate = useNavigate()
  const [showAddClient, setShowAddClient] = useState(false)

  // Home needs every client's data (for "active projects" and phase
  // progress on the client list below), unlike most pages which only load
  // one client's data at a time.
  useEffect(() => {
    clients.forEach((c) => ensureClientDataLoaded(c.id))
  }, [clients, ensureClientDataLoaded])

  const stats = useMemo(
    () => ({
      totalClients: clients.length,
      activeProjects: clients.filter((c) => c.status === 'active').length,
    }),
    [clients]
  )

  const todaysTasks = useMemo(() => {
    const clientTasks = clients.flatMap((c) =>
      c.tasks.filter((t) => !t.done).map((t) => ({ ...t, clientName: c.name, clientId: c.id as string | null }))
    )
    const studioTasks = studio.tasks
      .filter((t) => !t.done)
      .map((t) => ({ ...t, clientName: 'Studio', clientId: null as string | null }))
    return [...clientTasks, ...studioTasks]
      .filter((t) => {
        const due = formatDueDate(t.dueDate)
        return due.overdue || due.today
      })
      .sort((a, b) => toDisplayDate(a.dueDate).getTime() - toDisplayDate(b.dueDate).getTime())
  }, [clients, studio.tasks])

  const todaysEvents = useMemo(() => {
    const today = new Date()
    return studio.events
      .filter((e) => sameDay(toDisplayDate(e.date), today))
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  }, [studio.events])

  const upcomingEvents = useMemo(() => {
    const today = todayCivil()
    const horizon = new Date()
    horizon.setDate(horizon.getDate() + 14)
    return studio.events
      .filter((e) => e.date >= today && toDisplayDate(e.date).getTime() <= horizon.getTime())
      .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
      .slice(0, 6)
  }, [studio.events])

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [clients]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{formatHeaderDate(new Date())}</p>
          <h1 className="mt-0.5 text-3xl font-normal text-ink-primary">
            {greeting()}, {activeAccount.name}
          </h1>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85"
        >
          <Plus size={15} />
          New client
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary shadow-card hover:bg-surface-sunken"
        >
          <Plus size={14} />
          New client
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary shadow-card hover:bg-surface-sunken"
        >
          <Calendar size={14} />
          Add event
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary shadow-card hover:bg-surface-sunken"
        >
          <ListTodo size={14} />
          Open tasks
        </button>
      </div>

      <div className="flex divide-x divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-ink-muted">Clients</p>
          <p className="mt-1 text-3xl font-semibold text-ink-primary">{stats.totalClients}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-ink-muted">Active projects</p>
          <p className="mt-1 text-3xl font-semibold text-ink-primary">{stats.activeProjects}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-primary">Today</h3>
          </div>
          {todaysTasks.length === 0 && todaysEvents.length === 0 && (
            <p className="py-4 text-sm text-ink-muted">Nothing due today.</p>
          )}
          <div className="flex flex-col gap-2">
            {todaysTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(task.clientId ? `/clients/${task.clientId}/tasks` : '/tasks')}
                className="flex flex-col items-start gap-0.5 rounded-lg border border-black/[0.06] bg-surface-sunken/40 px-3.5 py-2.5 text-left hover:bg-surface-sunken/70"
              >
                <p className="text-sm font-medium text-ink-primary">{task.title}</p>
                <p className="text-xs text-ink-muted">{task.clientName}</p>
              </button>
            ))}
            {todaysEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate('/calendar')}
                className="flex flex-col items-start gap-0.5 rounded-lg border border-black/[0.06] bg-surface-sunken/40 px-3.5 py-2.5 text-left hover:bg-surface-sunken/70"
              >
                <p className="text-sm font-medium text-ink-primary">{event.title}</p>
                <p className="text-xs text-ink-muted">{event.time ?? 'All day'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-primary">Upcoming events</h3>
          </div>
          {upcomingEvents.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing on the calendar yet.</p>}
          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {upcomingEvents.map((event) => {
              const day = toDisplayDate(event.date)
              return (
                <li key={event.id}>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-sunken/40"
                  >
                    <div className="flex w-9 shrink-0 flex-col items-center">
                      <span className="text-sm font-semibold leading-tight text-ink-primary">{day.getDate()}</span>
                      <span className="text-[10px] uppercase leading-tight text-ink-muted">
                        {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-primary">{event.title}</p>
                    </div>
                    {event.time && <span className="shrink-0 rounded bg-surface-sunken px-2 py-1 text-xs text-ink-muted">{event.time}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white shadow-card">
        <div className="flex items-center gap-2 px-4 py-4">
          <h3 className="text-sm font-semibold text-ink-primary">Clients</h3>
          <span className="text-sm text-ink-muted">{clients.length}</span>
        </div>
        <div className="flex flex-col divide-y divide-black/[0.05]">
          {sortedClients.map((client) => {
            const progress = overallProgress(client)
            const doneCount = client.phases.filter((p) => phaseStatus(p) === 'done').length
            return (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}/dashboard`)}
                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken/40"
              >
                <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={32} />
                <p className="flex-1 text-sm font-medium text-ink-primary">{client.name}</p>
                <PhaseSegments client={client} />
                <div className="hidden w-24 items-center sm:flex">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <div className="h-full rounded-full bg-ink-primary" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-muted">{doneCount}/{PHASES.length}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Drawer open={showAddClient} onClose={() => setShowAddClient(false)} title="Add a client">
        <ClientForm onDone={() => setShowAddClient(false)} />
      </Drawer>
    </div>
  )
}
