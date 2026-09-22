import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  updates: 'Updates',
  tasks: 'Tasks',
  documents: 'Documents',
  library: 'Library',
  discovery: 'Discovery & Strategy',
  'brand-hub': 'Brand hub',
}

export default function ClientLayout() {
  const { clientId } = useParams<{ clientId: string }>()
  const { getClient } = useApp()
  const { profile } = useAuth()
  const { isClientView, setIsClientView } = useViewMode()
  const location = useLocation()
  const client = clientId ? getClient(clientId) : undefined

  if (!client) return <Navigate to="/" replace />

  const segments = location.pathname.split('/').filter(Boolean)
  const tabKey = segments[2] ?? 'dashboard'
  const tabLabel = TAB_LABELS[tabKey] ?? 'Dashboard'
  const isImmersiveSession = tabKey === 'discovery' && segments[3] === 'session'

  if (isImmersiveSession) return <Outlet context={client} />

  // The "viewing as" banner (with its exit link) only makes sense when an
  // agency user is previewing — a real client account is just their portal,
  // not a preview of it.
  const isAgencyPreview = isClientView && profile?.role !== 'client'

  return (
    <div>
      {isAgencyPreview && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-medium text-white">
          <span className="flex items-center gap-1.5">
            <Eye size={13} />
            Viewing as {client.name} would see it
          </span>
          <button onClick={() => setIsClientView(false)} className="underline underline-offset-2 hover:no-underline">
            Exit client view
          </button>
        </div>
      )}
      <p className="mb-4 text-xs text-ink-muted">
        Onwun <span className="mx-1">/</span> {client.name} <span className="mx-1">/</span> {tabLabel}
      </p>
      <Outlet context={client} />
    </div>
  )
}
