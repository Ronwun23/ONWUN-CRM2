import type { MouseEvent, ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useMatch } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
  Palette,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { CURRENT_USER } from '@/data/team'
import { ClientAvatar } from '@/components/Avatar'
import ClientAvatarStack from '@/components/ClientAvatarStack'
import Drawer from '@/components/Drawer'
import ClientForm from '@/components/ClientForm'

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
  const isImmersiveSession = Boolean(useMatch('/clients/:clientId/discovery/session'))
  // A client previewing their own portal only ever sees their own portal —
  // no route back to the studio's full client list.
  const lockedToClient = Boolean(client) && isClientView

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold lowercase text-white">
                o
              </div>
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
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold lowercase text-white">
                o
              </div>
              <div>
                <p className="text-sm font-bold leading-tight lowercase tracking-tight text-white">onwun</p>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/40">Studio</p>
              </div>
            </Link>
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

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-5 py-4">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: CURRENT_USER.color }}
          >
            {CURRENT_USER.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-tight text-white">{CURRENT_USER.name}</p>
            <p className="truncate text-[11px] leading-tight text-white/40">{CURRENT_USER.email}</p>
          </div>
        </div>
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
    </div>
  )
}
