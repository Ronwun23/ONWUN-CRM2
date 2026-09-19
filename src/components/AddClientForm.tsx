import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { TEAM } from '@/data/team'
import { createBlankClient } from '@/data/clients'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function AddClientForm({ onDone }: { onDone: () => void }) {
  const { addClient } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [projectName, setProjectName] = useState('Rebrand')
  const [owner, setOwner] = useState(TEAM[0].id)
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !dueDate) return

    const client = createBlankClient({
      name: name.trim(),
      projectName: projectName.trim() || 'Project',
      owner,
      dueDate,
    })

    addClient(client)
    onDone()
    navigate(`/clients/${client.id}/dashboard`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Client name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoFocus
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          name="new-client-name"
        />
      </div>
      <div>
        <label className={labelClass}>Project</label>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className={inputClass}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          name="new-client-project"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Owner</label>
          <Select value={owner} onChange={setOwner} options={TEAM.map((m) => ({ value: m.id, label: m.name }))} />
        </div>
        <div>
          <label className={labelClass}>Due date</label>
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select date" />
        </div>
      </div>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Add client
      </button>
    </form>
  )
}
