import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Briefcase, Calendar, CheckCircle2, Users } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { CURRENT_USER } from '@/data/team'
import StatCard from '@/components/StatCard'
import Card from '@/components/Card'
import Pill from '@/components/Pill'
import PhaseTrack from '@/components/PhaseTrack'
import { ClientAvatar, MemberAvatar } from '@/components/Avatar'
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_TONE } from '@/lib/labels'
import { currentPhaseKey, overallProgress } from '@/lib/progress'
import { formatDate, formatDueDate } from '@/lib/format'
import { toDisplayDate, todayCivil } from '@/lib/civilDate'
import { PHASE_LABELS } from '@/types'

function formatEventDate(civilOrIso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(toDisplayDate(civilOrIso))
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const ViewCalendarLink = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
    View calendar
    <ArrowRight size={12} />
  </button>
)

export default function HomePage() {
  const { clients, studio, toggleTask, toggleStudioTask } = useApp()
  const navigate = useNavigate()
  const goToCalendar = () => navigate('/calendar')

  const stats = useMemo(() => {
    const activeProjects = clients.filter((c) => c.status === 'active').length

    const waitingOnMeTasks = clients.flatMap((c) =>
      c.tasks.filter((t) => !t.done && t.assignee === CURRENT_USER.id).map((t) => ({ ...t, clientId: c.id }))
    )
    const waitingOnMeDocs = clients.flatMap((c) => c.documents.filter((d) => d.status === 'with_you'))
    const waitingOnMe = waitingOnMeTasks.length + waitingOnMeDocs.length

    const unpaidInvoices = clients.flatMap((c) => c.documents.filter((d) => d.type === 'invoice' && d.status === 'unpaid'))

    return {
      totalClients: clients.length,
      activeProjects,
      waitingOnMe,
      unpaidCount: unpaidInvoices.length,
    }
  }, [clients])

  const todaysTasks = useMemo(() => {
    const clientTasks = clients.flatMap((c) =>
      c.tasks.filter((t) => !t.done).map((t) => ({ ...t, clientName: c.name, clientId: c.id as string | null }))
    )
    // Studio-wide tasks (added from the top-level Tasks page) aren't tied to
    // any client, but they're just as much "due today" as a client's are.
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

  // "The calendar" is the studio-wide Calendar page (studio.events) — these
  // home cards mirror exactly what's on it, not a separate per-client list.
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
  }, [studio.events])

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [clients]
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Home</h1>
        <p className="text-sm text-ink-secondary">Everything across every client, at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={String(stats.totalClients)} icon={Users} />
        <StatCard label="Active projects" value={String(stats.activeProjects)} icon={Briefcase} />
        <StatCard
          label="Waiting on me"
          value={String(stats.waitingOnMe)}
          deltaTone={stats.waitingOnMe > 0 ? 'bad' : 'good'}
          delta={stats.waitingOnMe > 0 ? 'Needs attention' : 'All clear'}
          icon={AlertCircle}
        />
        <StatCard
          label="Unpaid invoices"
          value={String(stats.unpaidCount)}
          deltaTone={stats.unpaidCount > 0 ? 'bad' : 'good'}
          delta={stats.unpaidCount > 0 ? 'Follow up needed' : 'All settled'}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Today" subtitle="Tasks and calendar events" action={<ViewCalendarLink onClick={goToCalendar} />}>
          {todaysTasks.length === 0 && todaysEvents.length === 0 && (
            <p className="py-4 text-sm text-ink-muted">Nothing due today.</p>
          )}
          {todaysTasks.length > 0 && (
            <ul className="flex flex-col divide-y divide-black/[0.05]">
              {todaysTasks.map((task) => {
                const due = formatDueDate(task.dueDate)
                return (
                  <li key={task.id} className="flex items-center gap-3 py-2.5">
                    <button
                      onClick={() => (task.clientId ? toggleTask(task.clientId, task.id) : toggleStudioTask(task.id))}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-black/20 hover:border-brand-500"
                      aria-label="Toggle task"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-primary">{task.title}</p>
                      <button
                        onClick={() => navigate(task.clientId ? `/clients/${task.clientId}/tasks` : '/tasks')}
                        className="text-xs text-ink-muted hover:text-brand-600 hover:underline"
                      >
                        {task.clientName}
                      </button>
                    </div>
                    <span className={due.overdue ? 'text-xs font-medium text-status-critical' : 'text-xs text-ink-muted'}>
                      {due.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {todaysEvents.length > 0 && (
            <ul className={clsx('flex flex-col divide-y divide-black/[0.05]', todaysTasks.length > 0 && 'mt-1 border-t border-black/[0.05]')}>
              {todaysEvents.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={goToCalendar}
                    className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-sunken/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                      <Calendar size={14} />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm text-ink-primary">{event.title}</p>
                    <span className="text-xs text-ink-muted">{event.time ?? 'All day'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming events" subtitle="Next 14 days" action={<ViewCalendarLink onClick={goToCalendar} />}>
          {upcomingEvents.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing on the calendar yet.</p>}
          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={goToCalendar}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-sunken/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                    <Calendar size={14} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-ink-primary">{event.title}</p>
                  <span className="text-xs text-ink-muted">{formatEventDate(event.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Clients" subtitle={`${clients.length} total`} padded={false}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Phase</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.map((client) => {
              const progress = overallProgress(client)
              return (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}/dashboard`)}
                  className="cursor-pointer border-b border-black/[0.04] last:border-b-0 hover:bg-surface-sunken/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={32} />
                      <div>
                        <p className="font-medium text-ink-primary">{client.name}</p>
                        <p className="text-xs text-ink-muted">{client.projectName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={CLIENT_STATUS_TONE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Pill>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{PHASE_LABELS[currentPhaseKey(client)]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PhaseTrack client={client} />
                      <span className="text-xs tabular-nums text-ink-muted">{progress.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MemberAvatar memberId={client.owner} size={22} />
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(client.dueDate)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
