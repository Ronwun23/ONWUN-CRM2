import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, CheckSquare, LayoutDashboard, LogOut, Megaphone, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { useApp } from '@/context/AppContext'

const links = [
  { label: 'Home', to: '/', icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-ink-secondary" /> },
  { label: 'Updates', to: '/updates', icon: <Megaphone className="h-5 w-5 shrink-0 text-ink-secondary" /> },
  { label: 'Tasks', to: '/tasks', icon: <CheckSquare className="h-5 w-5 shrink-0 text-ink-secondary" /> },
  { label: 'Calendar', to: '/calendar', icon: <CalendarIcon className="h-5 w-5 shrink-0 text-ink-secondary" /> },
  { label: 'Settings', to: '/settings', icon: <Settings className="h-5 w-5 shrink-0 text-ink-secondary" /> },
  { label: 'Logout', to: '/', icon: <LogOut className="h-5 w-5 shrink-0 text-ink-secondary" /> },
]

function Logo() {
  return (
    <Link to="/" className="relative z-20 flex items-center gap-2 py-1 text-sm font-medium text-ink-primary">
      <div className="h-6 w-6 shrink-0 rounded-lg bg-black" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre">
        Onwun Studio
      </motion.span>
    </Link>
  )
}

function LogoIcon() {
  return (
    <Link to="/" className="relative z-20 flex items-center gap-2 py-1 text-sm font-medium text-ink-primary">
      <div className="h-6 w-6 shrink-0 rounded-lg bg-black" />
    </Link>
  )
}

function PlaceholderBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/[0.04] ${className}`} />
}

export default function SidebarTest() {
  const { activeAccount } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface-page text-ink-primary md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link, i) => (
                <SidebarLink key={i} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: activeAccount.name,
                to: '/settings',
                icon: (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: activeAccount.color }}
                  >
                    {activeAccount.initials}
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-8">
        <div>
          <p className="text-xs font-medium text-ink-muted">Sidebar navigation test</p>
          <h1 className="text-lg font-semibold text-ink-primary">Hover the sidebar to expand it</h1>
        </div>
        <div className="flex gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlaceholderBlock key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="flex flex-1 gap-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <PlaceholderBlock key={i} className="h-full w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
