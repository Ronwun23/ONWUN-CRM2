import type { ChangeEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useMatch } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Camera,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronsUpDown,
  FileText,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Palette,
  Target,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { STUDIO_ACCOUNTS } from '@/data/team'
import { ClientAvatar } from '@/components/Avatar'
import ClientAvatarStack from '@/components/ClientAvatarStack'
import Drawer from '@/components/Drawer'
import ClientForm from '@/components/ClientForm'
import SearchPalette from '@/components/SearchPalette'
import { confirmAction } from '@/lib/confirm'
import { fileToLogoDataUrl } from '@/lib/image'
import { formatDueDate } from '@/lib/format'

/** Bottom-left "who's managing this" switcher — lets Ro or Niall flip
 * between themselves, since either one might be driving the studio account
 * at any given time. Not shown/editable to a client previewing their portal. */
function AccountSwitcher({ editable }: { editable: boolean }) {
  const { activeAccount, setActiveAccount } = useApp()
  const { profile, session, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (profile?.role === 'client') {
    return (
      <div className="mt-auto flex items-center gap-2.5 border-t border-black/[0.06] px-5 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-xs font-semibold text-ink-primary">
          {(profile.full_name ?? session?.user.email ?? '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-tight text-ink-primary">{profile.full_name ?? 'Client'}</p>
          <p className="truncate text-[11px] leading-tight text-ink-muted">{session?.user.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-black/[0.04] hover:text-status-critical"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    )
  }

  const avatar = (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: activeAccount.color }}
    >
      {activeAccount.initials}
    </div>
  )

  if (!editable) {
    return (
      <div className="mt-auto flex items-center gap-2.5 border-t border-black/[0.06] px-5 py-4">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium leading-tight text-ink-primary">{activeAccount.name}</p>
          <p className="truncate text-[11px] leading-tight text-ink-muted">{activeAccount.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-black/[0.06] px-3 py-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1.5 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-pop">
          {STUDIO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                setActiveAccount(account.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface-sunken"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: account.color }}
              >
                {account.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight text-ink-primary">{account.name}</p>
                <p className="truncate text-[11px] leading-tight text-ink-muted">{account.email}</p>
              </div>
              {account.id === activeAccount.id && <Check size={13} className="shrink-0 text-brand-600" />}
            </button>
          ))}
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 border-t border-black/[0.06] px-3 py-2.5 text-left text-ink-secondary hover:bg-surface-sunken"
          >
            <Settings size={13} className="shrink-0" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
          <button
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex w-full items-center gap-2.5 border-t border-black/[0.06] px-3 py-2.5 text-left text-status-critical hover:bg-surface-sunken"
          >
            <LogOut size={13} className="shrink-0" />
            <span className="text-xs font-medium">Sign out</span>
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-black/[0.04]"
      >
        {avatar}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium leading-tight text-ink-primary">{activeAccount.name}</p>
          <p className="truncate text-[11px] leading-tight text-ink-muted">{activeAccount.email}</p>
        </div>
        <ChevronsUpDown size={13} className="shrink-0 text-ink-muted" />
      </button>
    </div>
  )
}

/** The studio's own brand mark, top-left of the sidebar. Editable by the
 * agency (click to upload, hover to reveal a remove button) — never by a
 * client previewing their own portal. */
function StudioLogo({ editable }: { editable: boolean }) {
  const { studio, setStudioLogo } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setStudioLogo(await fileToLogoDataUrl(file))
    } catch {
      // Not worth a visible error in a 32px widget — just leave the mark as-is.
    }
  }

  const mark = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500 text-sm font-bold lowercase text-white">
      {studio.logoUrl ? <img src={studio.logoUrl} alt="" className="h-full w-full object-cover" /> : 'o'}
    </div>
  )

  if (!editable) return mark

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label={studio.logoUrl ? 'Change studio logo' : 'Add studio logo'}
        title={studio.logoUrl ? 'Change studio logo' : 'Add studio logo'}
      >
        {mark}
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={13} className="text-white" />
        </div>
      </button>
      {studio.logoUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setStudioLogo(undefined)
          }}
          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black opacity-0 shadow transition-opacity group-hover:opacity-100"
          aria-label="Remove studio logo"
          title="Remove studio logo"
        >
          <X size={9} strokeWidth={3} />
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  )
}

const STUDIO_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/updates', label: 'Updates', icon: Megaphone, end: false },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon, end: false },
]

const ACQUISITION_NAV_ITEMS = [
  { to: '/acquisition/setup', label: 'Setup', icon: Target },
  { to: '/acquisition/find', label: 'Find companies', icon: Search },
  { to: '/acquisition/contacts', label: 'Contacts', icon: Users },
  { to: '/acquisition/pipeline', label: 'Pipeline', icon: GitBranch },
  { to: '/acquisition/today', label: 'Today', icon: ListTodo },
]

const CLIENT_NAV_ITEMS = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'updates', label: 'Updates', icon: Megaphone },
  { to: 'tasks', label: 'Tasks', icon: CheckSquare },
  { to: 'documents', label: 'Documents', icon: FileText },
  { to: 'library', label: 'Library', icon: BookOpen },
  { to: 'discovery', label: 'Discovery & Strategy', icon: Sparkles },
  { to: 'brand-hub', label: 'Brand hub', icon: Palette },
  { to: 'settings', label: 'Client settings', icon: Settings, studioOnly: true },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { clients, studio, getClient, removeClient } = useApp()
  const { isClientView } = useViewMode()
  const clientMatch = useMatch('/clients/:clientId/*')
  const clientId = clientMatch?.params.clientId
  const client = clientId ? getClient(clientId) : undefined
  // Each project type gets its own layout over time — for now, Social Media
  // Management clients trade the Brand hub for a Content calendar.
  const clientNavItems =
    client?.projectName === 'Social Media Management'
      ? CLIENT_NAV_ITEMS.map((item) =>
          item.to === 'brand-hub' ? { ...item, to: 'content-calendar', label: 'Content calendar', icon: CalendarIcon } : item
        )
      : CLIENT_NAV_ITEMS
  const [showAddClient, setShowAddClient] = useState(false)
  const [clientListExpanded, setClientListExpanded] = useState(false)
  const [acquisitionExpanded, setAcquisitionExpanded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  // Whatever had focus the instant the palette was triggered (the sidebar
  // button, or nothing in particular if opened via ⌘K from elsewhere) —
  // captured here, before the palette mounts and its input steals focus,
  // so it can be restored on dismissal.
  const searchTriggerRef = useRef<HTMLElement | null>(null)
  // A client previewing their own portal only ever sees their own portal —
  // no route back to the studio's full client list.
  const lockedToClient = Boolean(client) && isClientView
  // The little dot next to "Tasks" — only counts studio-wide tasks (always
  // loaded) rather than every client's too, since per-client tasks are
  // lazy-loaded and wouldn't give an honest signal from just anywhere in
  // the app the way they can on Home (which explicitly warms them all up).
  const hasStudioTaskDueSoon = studio.tasks.some((t) => {
    if (t.done) return false
    const due = formatDueDate(t.dueDate)
    return due.overdue || due.today
  })

  const openSearch = () => {
    searchTriggerRef.current = document.activeElement as HTMLElement | null
    setSearchOpen(true)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    searchTriggerRef.current?.focus()
  }

  useEffect(() => {
    if (lockedToClient) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lockedToClient])

  const handleRemoveClient = async (e: MouseEvent, name: string, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const confirmed = await confirmAction(
      `Remove "${name}"? This deletes all their tasks, documents, and workshop answers — it can't be undone.`,
      { confirmLabel: 'Remove', destructive: true }
    )
    if (confirmed) removeClient(id)
  }

  return (
    <div className="bg-dot-grid flex h-screen w-full overflow-hidden bg-surface-page text-ink-primary">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white/70 shadow-pop transition-colors hover:text-white"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={17} strokeWidth={1.5} />
        </button>
      )}

      <aside
        className={clsx(
          'flex shrink-0 flex-col overflow-hidden border-r border-black/[0.06] bg-surface-sidebar transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-0'
        )}
      >
        <div className="flex h-full w-60 flex-col">
        {lockedToClient ? (
          <div className="flex items-center justify-between gap-2.5 border-b border-black/[0.06] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <StudioLogo editable={false} />
              <div>
                <p className="text-sm font-bold leading-tight lowercase tracking-tight text-ink-primary">onwun</p>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-ink-muted">Studio</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink-primary"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5 border-b border-black/[0.06] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <StudioLogo editable={!isClientView} />
              <Link to="/">
                <p className="text-sm font-bold leading-tight lowercase tracking-tight text-ink-primary">onwun</p>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-ink-muted">Studio</p>
              </Link>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink-primary"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {!lockedToClient && (
          <div className="px-3 pt-3">
            <button
              onClick={openSearch}
              className="flex w-full items-center gap-2.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-left text-sm text-ink-muted shadow-card transition-colors hover:text-ink-secondary"
            >
              <Search size={15} />
              <span className="flex-1">Search</span>
              <kbd className="rounded border border-black/[0.08] px-1.5 py-0.5 text-[10px] text-ink-muted">⌘K</kbd>
            </button>
          </div>
        )}

        {client ? (
          <>
            {!lockedToClient && (
              <div className="px-3 pt-3">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-secondary hover:bg-black/[0.04] hover:text-ink-primary"
                >
                  <ArrowLeft size={14} />
                  All clients
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2.5 px-5 py-4">
              <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-ink-primary">{client.name}</p>
                <p className="truncate text-xs leading-tight text-ink-muted">{client.projectName}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-0.5 px-3 py-1">
              {clientNavItems.filter((item) => !item.studioOnly || !isClientView).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={`/clients/${client.id}/${to}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-black text-white' : 'text-ink-secondary hover:bg-black/[0.04] hover:text-ink-primary'
                    )
                  }
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="flex flex-col gap-0.5 px-3 pt-3">
              {STUDIO_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-black text-white' : 'text-ink-secondary hover:bg-black/[0.04] hover:text-ink-primary'
                    )
                  }
                >
                  <Icon size={16} strokeWidth={2} />
                  <span className="flex-1">{label}</span>
                  {label === 'Tasks' && hasStudioTaskDueSoon && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-primary" />}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between px-5">
              <button
                onClick={() => setClientListExpanded((v) => !v)}
                aria-expanded={clientListExpanded}
                aria-label={clientListExpanded ? 'Collapse client list' : 'Expand client list'}
                className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:text-ink-secondary"
              >
                Clients · {clients.length}
                <ChevronDown size={12} className={clsx('transition-transform', clientListExpanded && 'rotate-180')} />
              </button>
              <button
                onClick={() => setShowAddClient(true)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-ink-secondary hover:bg-black/[0.04] hover:text-ink-primary"
                aria-label="Add client"
                title="Add client"
              >
                <Plus size={14} />
              </button>
            </div>

            {clientListExpanded ? (
              <nav className="mt-1.5 flex max-h-40 flex-wrap content-start gap-2 overflow-y-auto px-3 pb-3">
                {clients.map((c) => (
                  <div key={c.id} className="group relative">
                    <NavLink
                      to={`/clients/${c.id}/dashboard`}
                      title={c.name}
                      className={({ isActive }) =>
                        clsx(
                          'flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-offset-2 ring-offset-surface-sidebar transition-colors',
                          isActive ? 'ring-black' : 'ring-transparent hover:ring-black/15'
                        )
                      }
                    >
                      <ClientAvatar initials={c.initials} color={c.color} avatarUrl={c.avatarUrl} size={36} />
                    </NavLink>
                    <button
                      onClick={(e) => handleRemoveClient(e, c.name, c.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black/0 opacity-0 shadow ring-1 ring-black/[0.08] transition-opacity hover:text-status-critical group-hover:text-ink-muted group-hover:opacity-100 group-focus-within:opacity-100"
                      aria-label={`Remove ${c.name}`}
                      title={`Remove ${c.name}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddClient(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-black/20 text-ink-muted hover:border-black/40 hover:text-ink-secondary"
                  aria-label="Add client"
                  title="Add client"
                >
                  <Plus size={14} />
                </button>
              </nav>
            ) : (
              <button
                onClick={() => setClientListExpanded(true)}
                className="mt-3 flex flex-col items-center gap-2 px-3 py-1"
                aria-label="Expand client list"
              >
                <ClientAvatarStack clients={clients} ringClassName="ring-surface-sidebar" />
              </button>
            )}

            <button
              onClick={() => setAcquisitionExpanded((v) => !v)}
              aria-expanded={acquisitionExpanded}
              aria-label={acquisitionExpanded ? 'Collapse client acquisition' : 'Expand client acquisition'}
              className="mt-4 flex items-center gap-1 px-5 text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:text-ink-secondary"
            >
              Client Acquisition
              <ChevronDown size={12} className={clsx('transition-transform', acquisitionExpanded && 'rotate-180')} />
            </button>
            {acquisitionExpanded && (
              <nav className="flex flex-col gap-0.5 px-3 pt-1.5">
                {ACQUISITION_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-black text-white' : 'text-ink-secondary hover:bg-black/[0.04] hover:text-ink-primary'
                      )
                    }
                  >
                    <Icon size={16} strokeWidth={2} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        )}

        <AccountSwitcher editable={!isClientView} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className={clsx('mx-auto max-w-[1400px]', sidebarOpen ? 'px-8 py-7' : 'pl-16 pr-8 pt-14 pb-7')}>
          {children}
        </div>
      </main>

      <Drawer open={showAddClient} onClose={() => setShowAddClient(false)} title="Add a client">
        <ClientForm onDone={() => setShowAddClient(false)} />
      </Drawer>

      <SearchPalette open={searchOpen} onClose={closeSearch} />
    </div>
  )
}
