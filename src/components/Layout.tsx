import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useMatch } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Megaphone,
  Plus,
  Sparkles,
  Palette,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { CURRENT_USER } from '@/data/team'
import { ClientAvatar } from '@/components/Avatar'
import Drawer from '@/components/Drawer'
import AddClientForm from '@/components/AddClientForm'

const CLIENT_NAV_ITEMS = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'updates', label: 'Updates', icon: Megaphone },
  { to: 'tasks', label: 'Tasks', icon: CheckSquare },
  { to: 'documents', label: 'Documents', icon: FileText },
  { to: 'library', label: 'Library', icon: BookOpen },
  { to: 'discovery', label: 'Discovery & Strategy', icon: Sparkles },
  { to: 'brand-hub', label: 'Brand hub', icon: Palette },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { clients, getClient } = useApp()
  const clientMatch = useMatch('/clients/:clientId/*')
  const clientId = clientMatch?.params.clientId
  const client = clientId ? getClient(clientId) : undefined
  const [showAddClient, setShowAddClient] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-page text-ink-primary">
      <aside className="flex w-60 shrink-0 flex-col bg-black">
        <Link to="/" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold lowercase text-white">
            o
          </div>
          <div>
            <p className="text-sm font-bold leading-tight lowercase tracking-tight text-white">onwun</p>
            <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/40">Studio</p>
          </div>
        </Link>

        {client ? (
          <>
            <div className="px-3 pt-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft size={14} />
                All clients
              </Link>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-4">
              <ClientAvatar initials={client.initials} color={client.color} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-white">{client.name}</p>
                <p className="truncate text-xs leading-tight text-white/40">{client.projectName}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-0.5 px-3 py-1">
              {CLIENT_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                  )
                }
              >
                <LayoutDashboard size={17} strokeWidth={2} />
                Home
              </NavLink>
            </nav>

            <div className="mt-4 flex items-center justify-between px-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Clients · {clients.length}
              </p>
              <button
                onClick={() => setShowAddClient(true)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-white/50 hover:bg-white/[0.06] hover:text-white"
                aria-label="Add client"
                title="Add client"
              >
                <Plus size={14} />
              </button>
            </div>

            <nav className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
              {clients.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/clients/${c.id}/dashboard`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                    )
                  }
                >
                  <ClientAvatar initials={c.initials} color={c.color} size={22} />
                  <span className="truncate">{c.name}</span>
                </NavLink>
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
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-7">{children}</div>
      </main>

      <Drawer open={showAddClient} onClose={() => setShowAddClient(false)} title="Add a client">
        <AddClientForm onDone={() => setShowAddClient(false)} />
      </Drawer>
    </div>
  )
}
