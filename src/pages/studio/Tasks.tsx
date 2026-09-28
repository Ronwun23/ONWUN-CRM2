import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { STUDIO_ACCOUNTS, resolveMember } from '@/data/team'
import Drawer from '@/components/Drawer'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { formatDueDate } from '@/lib/format'
import { toDisplayDate } from '@/lib/civilDate'
import type { ClientTask } from '@/types'

type StatusFilter = 'all' | 'todo' | 'done'

interface Row extends ClientTask {
  clientId: string | null
  clientName: string
  clientColor: string | null
}

function DueDatePill({ dueDate }: { dueDate: string }) {
  const due = formatDueDate(dueDate)
  const tone = due.overdue
    ? 'bg-[#fbecec] text-[#a92e2d]'
    : due.today
      ? 'bg-[#fdf1de] text-[#96660a]'
      : due.label === 'Tomorrow'
        ? 'bg-[#fdeee1] text-[#a15a1f]'
        : 'bg-surface-sunken text-ink-secondary'
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tone)}>
      <Calendar size={10} />
      {due.label}
    </span>
  )
}

export default function StudioTasks() {
  const { clients, studio, toggleStudioTask, toggleTask, addStudioTask, addTask, activeAccount, ensureClientDataLoaded } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)
  const [assignee, setAssignee] = useState(activeAccount.id)
  const [taskClientId, setTaskClientId] = useState('studio')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [search, setSearch] = useState('')

  // Every client's tasks, not just studio-wide ones — this page shows
  // everything across the whole studio, so (like Home) it needs to warm up
  // every client's lazily-loaded data up front.
  useEffect(() => {
    clients.forEach((c) => ensureClientDataLoaded(c.id))
  }, [clients, ensureClientDataLoaded])

  const allTasks = useMemo<Row[]>(() => {
    const studioRows = studio.tasks.map((t) => ({ ...t, clientId: null, clientName: 'Studio', clientColor: null }))
    const clientRows = clients.flatMap((c) => c.tasks.map((t) => ({ ...t, clientId: c.id, clientName: c.name, clientColor: c.color })))
    return [...studioRows, ...clientRows].sort(
      (a, b) => toDisplayDate(a.dueDate).getTime() - toDisplayDate(b.dueDate).getTime()
    )
  }, [studio.tasks, clients])

  const todoCount = allTasks.filter((t) => !t.done).length
  const doneCount = allTasks.filter((t) => t.done).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allTasks
      .filter((t) => (status === 'todo' ? !t.done : status === 'done' ? t.done : true))
      .filter((t) => !mineOnly || resolveMember(t.assignee).name === activeAccount.name)
      .filter((t) => !q || t.title.toLowerCase().includes(q))
  }, [allTasks, status, mineOnly, activeAccount, search])

  const handleToggle = (row: Row) => {
    if (row.clientId) toggleTask(row.clientId, row.id)
    else toggleStudioTask(row.id)
  }

  const handleAdd = async () => {
    if (!title.trim() || !dueDate) return
    const task: ClientTask = { id: `task-${Date.now()}`, title: title.trim(), done: false, dueDate, assignee }
    if (taskClientId === 'studio') await addStudioTask(task)
    else await addTask(taskClientId, task)
    setTitle('')
    setDueDate(undefined)
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Tasks</h1>
          <p className="text-sm text-ink-secondary">Every task across the studio, not just one client</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
        >
          <Plus size={12} />
          New task
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-card">
        <div className="flex items-center gap-1">
          {(
            [
              ['all', 'All', allTasks.length],
              ['todo', 'To do', todoCount],
              ['done', 'Done', doneCount],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                status === key ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
              )}
            >
              {label}
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                  status === key ? 'bg-black/[0.06] text-ink-primary' : 'bg-black/[0.04] text-ink-muted'
                )}
              >
                {count}
              </span>
            </button>
          ))}
          <button
            onClick={() => setMineOnly((v) => !v)}
            className={clsx(
              'ml-1 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors',
              mineOnly ? 'bg-black text-white' : 'bg-surface-sunken text-ink-secondary hover:bg-black/[0.06]'
            )}
          >
            Mine
          </button>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-2.5 py-1.5">
          <Search size={13} className="text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-40 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-xs uppercase tracking-wide text-ink-muted">
              <th className="w-10 px-3.5 py-2.5"></th>
              <th className="px-3.5 py-2.5 font-medium">Task</th>
              <th className="px-3.5 py-2.5 font-medium">Client</th>
              <th className="px-3.5 py-2.5 font-medium">Assignee</th>
              <th className="px-3.5 py-2.5 font-medium">Due date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-center text-sm text-ink-muted">
                  Nothing here.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-black/[0.04] last:border-b-0 hover:bg-surface-sunken/40">
                <td className="px-3.5 py-2.5">
                  <button
                    onClick={() => handleToggle(row)}
                    className={clsx(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      row.done ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'
                    )}
                    aria-label={row.done ? 'Reopen task' : 'Complete task'}
                  >
                    {row.done && <Check size={11} strokeWidth={3} />}
                  </button>
                </td>
                <td className={clsx('px-3.5 py-2.5', row.done ? 'text-ink-muted line-through' : 'text-ink-primary')}>{row.title}</td>
                <td className="px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-ink-secondary">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.clientColor ?? '#8b8d99' }}
                    />
                    {row.clientName}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  <MemberAvatar memberId={row.assignee} size={22} />
                </td>
                <td className="px-3.5 py-2.5">
                  <DueDatePill dueDate={row.dueDate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add a task">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Task</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Client</label>
            <Select
              value={taskClientId}
              onChange={setTaskClientId}
              options={[{ value: 'studio', label: 'Studio (not tied to a client)' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Due date</label>
            <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select date" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Assignee</label>
            <Select
              value={assignee}
              onChange={setAssignee}
              options={STUDIO_ACCOUNTS.map((a) => ({ value: a.id, label: memberName(a.id) }))}
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85"
          >
            Add task
          </button>
        </div>
      </Drawer>
    </div>
  )
}
