import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { STUDIO_ACCOUNTS } from '@/data/team'
import Card from '@/components/Card'
import Drawer from '@/components/Drawer'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { formatDueDate } from '@/lib/format'
import { toDisplayDate } from '@/lib/civilDate'

export default function ClientTasks() {
  const client = useClientOutlet()
  const { toggleTask, addTask, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)
  const [assignee, setAssignee] = useState(activeAccount.id)

  const open = client.tasks
    .filter((t) => !t.done)
    .sort((a, b) => toDisplayDate(a.dueDate).getTime() - toDisplayDate(b.dueDate).getTime())
  const done = client.tasks.filter((t) => t.done)

  const handleAdd = () => {
    if (!title.trim() || !dueDate) return
    addTask(client.id, {
      id: `task-${Date.now()}`,
      title: title.trim(),
      done: false,
      dueDate,
      assignee,
    })
    setTitle('')
    setDueDate(undefined)
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">Tasks</h1>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} />
            Add task
          </button>
        )}
      </div>

      <Card title="Open" padded={false}>
        <ul className="flex flex-col divide-y divide-black/[0.05] px-4">
          {open.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing open — nice work.</p>}
          {open.map((task) => {
            const due = formatDueDate(task.dueDate)
            return (
              <li key={task.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggleTask(client.id, task.id)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-black/20 hover:border-brand-500"
                  aria-label="Complete task"
                />
                <span className="flex-1 text-sm text-ink-primary">{task.title}</span>
                <span className={clsx('text-xs font-medium', due.overdue ? 'text-status-critical' : 'text-ink-muted')}>
                  {due.label}
                </span>
                <MemberAvatar memberId={task.assignee} size={22} />
              </li>
            )
          })}
        </ul>
      </Card>

      {done.length > 0 && (
        <Card title="Done" padded={false}>
          <ul className="flex flex-col divide-y divide-black/[0.05] px-4">
            {done.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggleTask(client.id, task.id)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-brand-500 bg-brand-500 text-white"
                  aria-label="Reopen task"
                >
                  <Check size={11} strokeWidth={3} />
                </button>
                <span className="flex-1 text-sm text-ink-muted line-through">{task.title}</span>
                <MemberAvatar memberId={task.assignee} size={22} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add a task">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Task</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
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
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Add task
          </button>
        </div>
      </Drawer>
    </div>
  )
}
