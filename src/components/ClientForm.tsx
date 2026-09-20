import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { STUDIO_ACCOUNTS, resolveMember } from '@/data/team'
import { createBlankClient, NEW_CLIENT_COLORS } from '@/data/clients'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { ClientAvatar } from '@/components/Avatar'
import { initialsFromName } from '@/lib/names'
import { fileToCompressedDataUrl } from '@/lib/image'
import type { Client } from '@/types'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

/** Add a new client, or edit an existing one — same fields either way. */
export default function ClientForm({ existing, onDone }: { existing?: Client; onDone: () => void }) {
  const { addClient, updateClientProfile, activeAccount } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState(existing?.name ?? '')
  const [projectName, setProjectName] = useState(existing?.projectName ?? 'Rebrand')
  const [owner, setOwner] = useState(existing ? resolveMember(existing.owner).name : activeAccount.name)
  const [dueDate, setDueDate] = useState<string | undefined>(existing?.dueDate)
  const [email, setEmail] = useState(existing?.email ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(existing?.avatarUrl)
  const [color] = useState(
    () => existing?.color ?? NEW_CLIENT_COLORS[Math.floor(Math.random() * NEW_CLIENT_COLORS.length)]
  )
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    try {
      setAvatarUrl(await fileToCompressedDataUrl(file))
    } catch {
      setPhotoError("Couldn't read that image — try a different file.")
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !owner.trim() || !dueDate) return

    if (existing) {
      updateClientProfile(existing.id, {
        name: name.trim(),
        projectName: projectName.trim() || 'Project',
        owner: owner.trim(),
        dueDate,
        avatarUrl,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        initials: initialsFromName(name.trim()),
      })
      onDone()
      return
    }

    const client = createBlankClient({
      name: name.trim(),
      projectName: projectName.trim() || 'Project',
      owner: owner.trim(),
      dueDate,
      color,
      avatarUrl,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    })
    addClient(client)
    onDone()
    navigate(`/clients/${client.id}/dashboard`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ClientAvatar initials={initialsFromName(name) || '?'} color={color} avatarUrl={avatarUrl} size={56} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-white hover:bg-brand-600"
            aria-label="Upload photo"
          >
            <Camera size={12} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            {avatarUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(undefined)}
              className="ml-3 text-sm text-ink-muted hover:text-status-critical"
            >
              Remove
            </button>
          )}
          <p className="mt-0.5 text-xs text-ink-muted">Optional — square images work best.</p>
          {photoError && <p className="mt-0.5 text-xs text-status-critical">{photoError}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Client name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoFocus={!existing}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          name="client-name"
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
          name="client-project"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Owner</label>
          <Select
            value={owner}
            onChange={setOwner}
            options={STUDIO_ACCOUNTS.map((a) => ({ value: a.name, label: a.name }))}
            placeholder="Select…"
          />
        </div>
        <div>
          <label className={labelClass}>Due date</label>
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select date" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@company.com"
            className={inputClass}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            name="client-email"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            name="client-phone"
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        {existing ? 'Save changes' : 'Add client'}
      </button>
    </form>
  )
}
