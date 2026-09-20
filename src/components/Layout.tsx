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
  LayoutDashboard,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Palette,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { STUDIO_ACCOUNTS } from '@/data/team'
import { ClientAvatar } from '@/components/Avatar'
import ClientAvatarStack from '@/components/ClientAvatarStack'
import Drawer from '@/components/Drawer'
import ClientForm from '@/components/ClientForm'
import SearchPalette from '@/components/SearchPalette'
import { fileToLogoDataUrl } from '@/lib/image'

/** Bottom-left "who's managing this" switcher — lets Ro or Niall flip
 * between themselves, since either one might be driving the studio account
 * at any given time. Not shown/editable to a client previewing their portal. */
function AccountSwitcher({ editable }: { editable: boolean }) {
  const { activeAccount, setActiveAccount } = useApp()
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
      <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-5 py-4">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium leading-tight text-white">{activeAccount.name}</p>
          <p className="truncate text-[11px] leading-tight text-white/40">{activeAccount.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-white/10 px-3 py-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1.5 overflow-hidden rounded-lg border border-white/10 bg-[#141414] shadow-pop">
          {STUDIO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                setActiveAccount(account.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.06]"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: account.color }}
              >
                {account.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight text-white">{account.name}</p>
                <p className="truncate text-[11px] leading-tight text-white/40">{account.email}</p>
              </div>
              {account.id === activeAccount.id && <Check size={13} className="shrink-0 text-brand-400" />}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.06]"
      >
        {avatar}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium leading-tight text-white">{activeAccount.name}</p>
          <p className="truncate text-[11px] leading-tight text-white/40">{activeAccount.email}</p>
        </div>
        <ChevronsUpDown size={13} className="shrink-0 text-white/40" />
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
  const { clients, getClient, removeClient } = useApp()
  const { isClientView } = useViewMode()
  const clientMatch = useMatch('/clients/:clientId/*')
  const clientId = clientMatch?.params.clientId
  const client = clientId ? getClient(clientId) : undefined
  const [showAddClient, setShowAddClient] = useState(false)
  const [clientListExpanded, setClientListExpanded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  // Whatever had focus the instant the palette was triggered (the sidebar
  // button, or nothing in particular if opened via ⌘K from elsewhere) —
  // captured here, before the palette mounts and its input steals focus,
  // so it can be restored on dismissal.
  const searchTriggerRef = useRef<HTMLElement | null>(null)
  const isImmersiveSession = Boolean(useMatch('/clients/:clientId/discovery/session'))
  // A client previewing their own portal only ever sees their own portal —
  // no route back to the studio's full client list.
  const lockedToClient = Boolean(client) && isClientView

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

  const handleRemoveClient = (e: MouseEvent, name: string, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`Remove "${name}"? This deletes all their tasks, documents, and workshop answers — it can't be undone.`)) {
      removeClient(id)
    }
  }

  if (isImmersiveSession) {
    return <div className="h-screen w-full overflow-y-auto bg-surface-page text-ink-primary">{children}</div>
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-page text-ink-primary">
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
          'flex shrink-0 flex-col overflow-hidden bg-black transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-0'
        )}
      >
        <div className="flex h-full w-60 flex-col">
        {lockedToClient ? (
          <div className="flex items-center justify-between gap-2.5 border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-2.5">
              <StudioLogo editable={false} />
              <div>
                <p className="text-sm font-bold leading-tight lowercase tracking-tight text-white">onwun</p>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/40">Studio</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5 border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-2.5">
              <StudioLogo editable={!isClientView} />
              <Link to="/">
                <p className="text-sm font-bold leading-tight lowercase tracking-tight text-white">onwun</p>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/40">Studio</p>
              </Link>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
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
              className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <Search size={15} />
              <span className="flex-1">Search</span>
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/30">⌘K</kbd>
            </button>
          </div>
        )}

        {client ? (
          <>
            {!lockedToClient && (
              <div className="px-3 pt-3">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft size={14} />
                  All clients
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2.5 px-5 py-4">
              <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-white">{client.name}</p>
                <p className="truncate text-xs leading-tight text-white/40">{client.projectName}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-0.5 px-3 py-1">
              {CLIENT_NAV_ITEMS.filter((item) => !item.studioOnly || !isClientView).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={`/clients/${client.id}/${to}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
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
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                    )
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between px-5">
              <button
                onClick={() => setClientListExpanded((v) => !v)}
                aria-expanded={clientListExpanded}
                aria-label={clientListExpanded ? 'Collapse client list' : 'Expand client list'}
                className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-white/40 hover:text-white/70"
              >
                Clients · {clients.length}
                <ChevronDown size={12} className={clsx('transition-transform', clientListExpanded && 'rotate-180')} />
              </button>
              <button
                onClick={() => setShowAddClient(true)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-white/50 hover:bg-white/[0.06] hover:text-white"
                aria-label="Add client"
                title="Add client"
              >
                <Plus size={14} />
              </button>
            </div>

            {clientListExpanded ? (
              <nav className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
                {clients.map((c) => (
                  <div key={c.id} className="group relative">
                    <NavLink
                      to={`/clients/${c.id}/dashboard`}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-8 text-sm font-medium transition-colors',
                          isActive ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                        )
                      }
                    >
                      <ClientAvatar initials={c.initials} color={c.color} avatarUrl={c.avatarUrl} size={22} />
                      <span className="truncate">{c.name}</span>
                    </NavLink>
                    <button
                      onClick={(e) => handleRemoveClient(e, c.name, c.id)}
                      className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-white/0 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:text-white/50 group-hover:opacity-100 group-focus-within:opacity-100"
                      aria-label={`Remove ${c.name}`}
                      title={`Remove ${c.name}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddClient(true)}
                  className="mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg border border-dashed border-white/25">
                    <Plus size={12} />
                  </span>
                  Add client
                </button>
              </nav>
            ) : (
              <button
                onClick={() => setClientListExpanded(true)}
                className="mt-3 flex flex-col items-center gap-2 px-3 py-1"
                aria-label="Expand client list"
              >
                <ClientAvatarStack clients={clients} />
              </button>
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
