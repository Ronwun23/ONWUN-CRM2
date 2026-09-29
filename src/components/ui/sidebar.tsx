import type { ComponentProps, Dispatch, JSX, ReactNode, SetStateAction } from 'react'
import { createContext, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Links {
  label: string
  to: string
  icon: JSX.Element | ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: Dispatch<SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState
  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: Dispatch<SetStateAction<boolean>>
  animate?: boolean
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
)

export const SidebarBody = (props: ComponentProps<typeof motion.div>) => (
  <>
    <DesktopSidebar {...props} />
    <MobileSidebar {...(props as ComponentProps<'div'>)} />
  </>
)

export const DesktopSidebar = ({ className, children, ...props }: ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn('hidden h-full w-[280px] shrink-0 flex-col bg-surface-sidebar px-4 py-4 md:flex', className)}
      animate={{ width: animate ? (open ? '280px' : '68px') : '280px' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({ className, children, ...props }: ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar()
  return (
    <div className="flex h-10 w-full flex-row items-center justify-between bg-surface-sidebar px-4 py-4 md:hidden" {...props}>
      <div className="z-20 flex w-full justify-end">
        <Menu className="cursor-pointer text-ink-secondary" onClick={() => setOpen(!open)} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn('fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-white p-10', className)}
          >
            <div className="absolute right-10 top-10 z-50 cursor-pointer text-ink-secondary" onClick={() => setOpen(!open)}>
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links
  className?: string
  props?: ComponentProps<typeof Link>
}) => {
  const { open, animate } = useSidebar()
  return (
    <Link to={link.to} className={cn('group/sidebar flex items-center justify-start gap-2 py-2', className)} {...props}>
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="!m-0 inline-block whitespace-pre !p-0 text-sm text-ink-secondary transition duration-150 group-hover/sidebar:translate-x-1"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
