import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Droplet, Folder, Image, Plus, Sparkles, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Drawer from '@/components/Drawer'

const FOLDER_ICON: Record<string, LucideIcon> = {
  Logos: Image,
  Typography: Type,
  Colour: Droplet,
  Guidelines: Sparkles,
}

export default function ClientLibrary() {
  const client = useClientOutlet()
  const { addLibraryFolder } = useApp()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addLibraryFolder(client.id, { id: `folder-${Date.now()}`, name: name.trim(), files: [] })
    setName('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Library</h1>
          <p className="text-sm text-ink-secondary">Individual brand assets, organised so you can grab exactly what you need.</p>
        </div>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} />
            New folder
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {client.library.length === 0 && <p className="text-sm text-ink-muted">No folders yet.</p>}
        {client.library.map((folder) => {
          const Icon = FOLDER_ICON[folder.name] ?? Folder
          return (
            <Link
              key={folder.id}
              to={`/clients/${client.id}/library/${folder.id}`}
              className="rounded-xl border border-black/[0.06] bg-white p-4 text-left shadow-card transition-shadow hover:shadow-pop"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                <Icon size={16} />
              </div>
              <p className="mt-3 text-sm font-medium text-ink-primary">{folder.name}</p>
              <p className="text-xs text-ink-muted">
                {folder.files.length === 0 ? 'Empty' : `${folder.files.length} file${folder.files.length === 1 ? '' : 's'}`}
              </p>
            </Link>
          )
        })}
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="New folder">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Icons, Photography"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Create folder
          </button>
        </form>
      </Drawer>
    </div>
  )
}
