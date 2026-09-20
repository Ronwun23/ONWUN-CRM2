import { useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { File as FileIcon, Upload } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import type { LibraryFileType } from '@/types'

const ACCEPT = '.pdf,.png,.ttf,application/pdf,image/png,font/ttf,font/sfnt'

function inferFileType(file: File): LibraryFileType {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (file.type === 'image/png' || name.endsWith('.png')) return 'png'
  if (name.endsWith('.ttf') || file.type === 'font/ttf' || file.type === 'font/sfnt') return 'ttf'
  return 'other'
}

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function LibraryFileForm({
  clientId,
  folderId,
  onDone,
}: {
  clientId: string
  folderId: string
  onDone: () => void
}) {
  const { addLibraryFile } = useApp()
  const [title, setTitle] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<LibraryFileType>('other')
  const [url, setUrl] = useState('')
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const type = inferFileType(file)
    if (type === 'other') {
      setError('Only PDF, PNG or TTF files are supported.')
      return
    }
    setError(null)
    setFileType(type)
    setFileName(file.name)
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
    const reader = new FileReader()
    reader.onload = () => setUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url) return
    addLibraryFile(clientId, folderId, {
      id: `libfile-${Date.now()}`,
      title: title.trim(),
      fileType,
      fileName,
      url,
      updatedAt: new Date().toISOString(),
    })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>File</label>
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDraggingOver(true)
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={clsx(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
            isDraggingOver ? 'border-brand-500 bg-brand-50' : 'border-black/20 bg-surface-sunken/40 hover:border-brand-500'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {fileName ? (
            <>
              <FileIcon className="text-brand-600" size={20} />
              <p className="max-w-full truncate text-sm font-medium text-ink-primary">{fileName}</p>
              <p className="text-xs text-ink-muted">Click to replace</p>
            </>
          ) : (
            <>
              <Upload className="text-ink-muted" size={20} />
              <p className="text-sm text-ink-secondary">Drag and drop a file, or click to upload</p>
              <p className="text-xs text-ink-muted">PDF, PNG or TTF</p>
            </>
          )}
        </label>
        {error && <p className="mt-1.5 text-xs text-status-critical">{error}</p>}
      </div>

      <div>
        <label className={labelClass}>Name</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Primary logo"
          className={inputClass}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
      </div>

      <button
        type="submit"
        disabled={!url}
        className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add file
      </button>
    </form>
  )
}
