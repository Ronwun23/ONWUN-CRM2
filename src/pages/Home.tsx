import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Briefcase, Calendar, CheckCircle2, Users } from 'lucide-react'
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
import { PHASE_LABELS } from '@/types'

export default function HomePage() {
  const { clients, toggleTask } = useApp()
  const navigate = useNavigate()

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
    return clients
      .flatMap((c) => c.tasks.filter((t) => !t.done).map((t) => ({ ...t, clientName: c.name, clientId: c.id })))
      .filter((t) => {
        const due = formatDueDate(t.dueDate)
        return due.overdue || due.today
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [clients])

  const upcomingEvents = useMemo(() => {
    const now = Date.now()
    const horizon = now + 14 * 86400000
    return clients
      .flatMap((c) => c.events.map((e) => ({ ...e, clientName: c.name, clientId: c.id })))
      .filter((e) => new Date(e.date).getTime() >= now - 86400000 && new Date(e.date).getTime() <= horizon)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [clients])

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
        <Card title="Today" subtitle="Due today or overdue, across every client">
          {todaysTasks.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing due — you're clear.</p>}
          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {todaysTasks.map((task) => {
              const due = formatDueDate(task.dueDate)
              return (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => toggleTask(task.clientId, task.id)}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-black/20 hover:border-brand-500"
                    aria-label="Toggle task"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-primary">{task.title}</p>
                    <button
                      onClick={() => navigate(`/clients/${task.clientId}/tasks`)}
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
        </Card>

        <Card title="Upcoming events" subtitle="Next 14 days">
          {upcomingEvents.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing on the calendar yet.</p>}
          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {upcomingEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-primary">{event.title}</p>
                  <button
                    onClick={() => navigate(`/clients/${event.clientId}/dashboard`)}
                    className="text-xs text-ink-muted hover:text-brand-600 hover:underline"
                  >
                    {event.clientName}
                  </button>
                </div>
                <span className="text-xs text-ink-muted">{formatDate(event.date)}</span>
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
