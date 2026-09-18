import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useApp } from '@/context/AppContext'

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
  const location = useLocation()
  const client = clientId ? getClient(clientId) : undefined

  if (!client) return <Navigate to="/" replace />

  const segments = location.pathname.split('/').filter(Boolean)
  const tabKey = segments[2] ?? 'dashboard'
  const tabLabel = TAB_LABELS[tabKey] ?? 'Dashboard'
  const isImmersiveSession = tabKey === 'discovery' && segments[3] === 'session'

  if (isImmersiveSession) return <Outlet context={client} />

  return (
    <div>
      <p className="mb-4 text-xs text-ink-muted">
        Onwun <span className="mx-1">/</span> {client.name} <span className="mx-1">/</span> {tabLabel}
      </p>
      <Outlet context={client} />
    </div>
  )
}
