import { useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { formatDate } from '@/lib/format'

export default function ClientLibrary() {
  const client = useClientOutlet()
  const { addLibraryItem } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addLibraryItem(client.id, {
      id: `lib-${Date.now()}`,
      title: title.trim(),
      category: category.trim() || 'General',
      updatedAt: new Date().toISOString(),
    })
    setTitle('')
    setCategory('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">Library</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <ul className="flex flex-col divide-y divide-black/[0.05]">
          {client.library.length === 0 && <p className="px-4 py-6 text-sm text-ink-muted">Nothing stored here yet.</p>}
          {client.library.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-primary">{item.title}</p>
                <p className="text-xs text-ink-muted">{item.category}</p>
              </div>
              <span className="text-xs text-ink-muted">{formatDate(item.updatedAt)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add to library">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Research, Recordings, Design files"
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
            Add
          </button>
        </form>
      </Drawer>
    </div>
  )
}
