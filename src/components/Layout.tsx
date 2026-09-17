import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, KanbanSquare, Users2 } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/leads', label: 'Leads', icon: Users2 },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-page text-ink-primary">
      <aside className="flex w-60 shrink-0 flex-col bg-black">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold lowercase text-white">
            o
          </div>
          <div>
            <p className="text-sm font-bold leading-tight lowercase tracking-tight text-white">onwun</p>
            <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/40">CRM</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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

        <div className="mt-auto px-5 py-4 text-xs text-white/30">
          <p>Onwun CRM · v0.1</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-7">{children}</div>
      </main>
    </div>
  )
}
