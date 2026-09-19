import { useState } from 'react'
import type { FormEvent } from 'react'
import { Droplet, Image, Palette, Plus, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/format'
import type { BrandAssetType } from '@/types'

const TYPE_ICON: Record<BrandAssetType, LucideIcon> = {
  logo: Image,
  color: Droplet,
  typography: Type,
  guideline: Palette,
  other: Image,
}

const TYPE_OPTIONS: BrandAssetType[] = ['logo', 'color', 'typography', 'guideline', 'other']

export default function ClientBrandHub() {
  const client = useClientOutlet()
  const { addBrandAsset } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<BrandAssetType>('logo')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addBrandAsset(client.id, { id: `asset-${Date.now()}`, title: title.trim(), type, addedAt: new Date().toISOString() })
    setTitle('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Brand hub</h1>
          <p className="text-sm text-ink-secondary">Final brand assets, once delivered</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          Add asset
        </button>
      </div>

      {client.brandHub.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.12] bg-white/60 p-10 text-center">
          <Palette className="mx-auto text-ink-muted" size={22} />
          <p className="mt-3 text-sm text-ink-secondary">Nothing delivered yet.</p>
          <p className="text-xs text-ink-muted">Final assets will land here once the brand is signed off.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {client.brandHub.map((asset) => {
            const Icon = TYPE_ICON[asset.type]
            return (
              <div key={asset.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                  <Icon size={16} />
                </div>
                <p className="mt-3 text-sm font-medium text-ink-primary">{asset.title}</p>
                <p className="text-xs text-ink-muted">Added {formatDate(asset.addedAt)}</p>
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add brand asset">
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
            <Select
              value={type}
              onChange={(v) => setType(v as BrandAssetType)}
              options={TYPE_OPTIONS.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
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
