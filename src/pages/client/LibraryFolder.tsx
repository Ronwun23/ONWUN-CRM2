import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, File as FileIcon, FileText, Image, Plus, Trash2, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Drawer from '@/components/Drawer'
import LibraryFileForm from '@/components/LibraryFileForm'
import { formatDate } from '@/lib/format'
import type { LibraryFileType } from '@/types'

const FILE_TYPE_ICON: Record<LibraryFileType, LucideIcon> = {
  pdf: FileText,
  png: Image,
  ttf: Type,
  other: FileIcon,
}

const FILE_TYPE_LABEL: Record<LibraryFileType, string> = {
  pdf: 'PDF',
  png: 'PNG',
  ttf: 'Font (TTF)',
  other: 'File',
}

export default function ClientLibraryFolder() {
  const client = useClientOutlet()
  const { folderId } = useParams<{ folderId: string }>()
  const { removeLibraryFile } = useApp()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)

  const folder = client.library.find((f) => f.id === folderId)
  if (!folder) return <Navigate to={`/clients/${client.id}/library`} replace />

  const handleRemove = (fileId: string, title: string) => {
    if (!window.confirm(`Remove "${title}"? This can't be undone.`)) return
    removeLibraryFile(client.id, folder.id, fileId)
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/clients/${client.id}/library`}
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={13} />
        Library
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">{folder.name}</h1>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} />
            Add file
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {folder.files.length === 0 && <p className="text-sm text-ink-muted">Nothing in this folder yet.</p>}
        {folder.files.map((file) => {
          const Icon = FILE_TYPE_ICON[file.fileType]
          return (
            <div key={file.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                  <Icon size={16} />
                </div>
                {!isClientView && (
                  <button
                    onClick={() => handleRemove(file.id, file.title)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                    aria-label="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-medium text-ink-primary">{file.title}</p>
              <p className="text-xs text-ink-muted">{FILE_TYPE_LABEL[file.fileType]}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-ink-muted">Updated {formatDate(file.updatedAt)}</p>
                {file.url && (
                  <a
                    href={file.url}
                    download={file.fileName}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Download
                    <Download size={11} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title={`Add file to ${folder.name}`}>
        <LibraryFileForm clientId={client.id} folderId={folder.id} onDone={() => setShowAdd(false)} />
      </Drawer>
    </div>
  )
}
