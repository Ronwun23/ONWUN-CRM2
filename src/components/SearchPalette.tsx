import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckSquare, FileText, LayoutDashboard, Megaphone } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ClientAvatar } from '@/components/Avatar'
import { DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

const PAGES = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/updates', label: 'Updates', icon: Megaphone },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
]

/** Cmd/Ctrl+K command palette — jump to a page, a client, or a specific
 * document instead of clicking through the sidebar to find one. Built on
 * cmdk (what shadcn/ui's Command component wraps), which supplies the
 * arrow-key/Enter selection and live filtering.
 *
 * Focus restoration on dismissal is handled by the caller (via `onClose`),
 * not here — by the time this component's own effects run, the command
 * input's autoFocus has already stolen focus, so this is too late to
 * capture what was focused *before* the palette opened. */
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  const documents = clients.flatMap((c) => c.documents.map((doc) => ({ doc, client: c })))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the CRM"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-pop"
      >
        <Command loop>
          <CommandInput autoFocus placeholder="Search clients, documents, or pages…" />
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>

            <CommandGroup heading="Pages">
              {PAGES.map(({ to, label, icon: Icon }) => (
                <CommandItem key={to} value={label} onSelect={() => go(to)}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                    <Icon size={14} />
                  </div>
                  <p className="text-sm font-medium text-ink-primary">{label}</p>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Clients">
              {clients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.projectName}`}
                  onSelect={() => go(`/clients/${c.id}/dashboard`)}
                >
                  <ClientAvatar initials={c.initials} color={c.color} avatarUrl={c.avatarUrl} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-primary">{c.name}</p>
                    <p className="truncate text-xs text-ink-muted">{c.projectName}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Documents">
              {documents.map(({ doc, client }) => (
                <CommandItem
                  key={doc.id}
                  value={`${doc.title} ${client.name}`}
                  onSelect={() => go(`/clients/${client.id}/documents/${doc.id}`)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-primary">{doc.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {client.name} · {DOCUMENT_TYPE_LABEL[doc.type]}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
