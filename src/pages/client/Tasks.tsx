import { useMemo, useState } from 'react'
import { Calendar, Check, Plus, Search, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { STUDIO_ACCOUNTS, resolveMember } from '@/data/team'
import Drawer from '@/components/Drawer'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { formatDueDate } from '@/lib/format'
import { toDisplayDate } from '@/lib/civilDate'
import { confirmAction } from '@/lib/confirm'
import type { ClientTask } from '@/types'

type StatusFilter = 'all' | 'todo' | 'done'

function DueDatePill({ dueDate }: { dueDate: string }) {
  const due = formatDueDate(dueDate)
  const tone = due.overdue
    ? 'bg-[#fbecec] text-[#a92e2d]'
    : due.today
      ? 'bg-[#fdf1de] text-[#96660a]'
      : due.diffDays === 1
        ? 'bg-[#fdeee1] text-[#a15a1f]'
        : due.diffDays <= 6
          ? 'bg-[#fdf6ea] text-[#ad8a4a]'
          : 'bg-surface-sunken text-ink-secondary'
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tone)}>
      <Calendar size={10} />
      {due.label}
    </span>
  )
}

export default function ClientTasks() {
  const client = useClientOutlet()
  const { toggleTask, addTask, removeTask, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)
  const [assignee, setAssignee] = useState(activeAccount.id)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [search, setSearch] = useState('')

  const sorted = useMemo(
    () => [...client.tasks].sort((a, b) => toDisplayDate(a.dueDate).getTime() - toDisplayDate(b.dueDate).getTime()),
    [client.tasks]
  )
  const todoCount = sorted.filter((t) => !t.done).length
  const doneCount = sorted.filter((t) => t.done).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted
      .filter((t) => (status === 'todo' ? !t.done : status === 'done' ? t.done : true))
      .filter((t) => !mineOnly || resolveMember(t.assignee).name === activeAccount.name)
      .filter((t) => !q || t.title.toLowerCase().includes(q))
  }, [sorted, status, mineOnly, activeAccount, search])

  const handleAdd = async () => {
    if (!title.trim() || !dueDate) return
    const task: ClientTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      done: false,
      dueDate,
      startDate: startDate && new Date(startDate) < new Date(dueDate) ? startDate : undefined,
      assignee,
    }
    await addTask(client.id, task)
    setTitle('')
    setStartDate(undefined)
    setDueDate(undefined)
    setShowAdd(false)
  }

  const handleRemove = async (task: ClientTask) => {
    const confirmed = await confirmAction(`Delete "${task.title}"?`, { confirmLabel: 'Delete', destructive: true })
    if (confirmed) removeTask(client.id, task.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink-primary">Tasks</h1>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
          >
            <Plus size={12} />
            Add task
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-card">
        <div className="flex items-center gap-1">
          {(
            [
              ['all', 'All', sorted.length],
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
          {!isClientView && (
            <button
              onClick={() => setMineOnly((v) => !v)}
              className={clsx(
                'ml-1 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors',
                mineOnly ? 'bg-black text-white' : 'bg-surface-sunken text-ink-secondary hover:bg-black/[0.06]'
              )}
            >
              Mine
            </button>
          )}
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
              <th className="px-3.5 py-2.5 font-medium">Assignee</th>
              <th className="px-3.5 py-2.5 font-medium">Due date</th>
              {!isClientView && <th className="w-10 px-3.5 py-2.5"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isClientView ? 4 : 5} className="px-3.5 py-6 text-center text-sm text-ink-muted">
                  Nothing here.
                </td>
              </tr>
            )}
            {filtered.map((task) => (
              <tr key={task.id} className="group border-b border-black/[0.04] last:border-b-0 hover:bg-surface-sunken/40">
                <td className="px-3.5 py-2.5">
                  <button
                    onClick={() => toggleTask(client.id, task.id)}
                    className={clsx(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      task.done ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'
                    )}
                    aria-label={task.done ? 'Reopen task' : 'Complete task'}
                  >
                    {task.done && <Check size={11} strokeWidth={3} />}
                  </button>
                </td>
                <td className={clsx('px-3.5 py-2.5', task.done ? 'text-ink-muted line-through' : 'text-ink-primary')}>{task.title}</td>
                <td className="px-3.5 py-2.5">
                  <MemberAvatar memberId={task.assignee} size={22} />
                </td>
                <td className="px-3.5 py-2.5">
                  <DueDatePill dueDate={task.dueDate} />
                </td>
                {!isClientView && (
                  <td className="px-3.5 py-2.5">
                    <button
                      onClick={() => handleRemove(task)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted opacity-0 hover:bg-[#fbecec] hover:text-status-critical group-hover:opacity-100"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                )}
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Start date <span className="normal-case text-ink-muted/70">(optional)</span>
            </label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Select date" />
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
