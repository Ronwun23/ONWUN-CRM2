import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import { ViewModeProvider } from '@/context/ViewModeContext'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import HomePage from '@/pages/Home'
import StudioUpdates from '@/pages/studio/Updates'
import StudioTasks from '@/pages/studio/Tasks'
import StudioCalendar from '@/pages/studio/Calendar'
import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/Dashboard'
import ClientUpdates from '@/pages/client/Updates'
import ClientTasks from '@/pages/client/Tasks'
import ClientDocuments from '@/pages/client/Documents'
import DocumentDetail from '@/pages/client/DocumentDetail'
import ClientLibrary from '@/pages/client/Library'
import ClientLibraryFolder from '@/pages/client/LibraryFolder'
import ClientBrandHub from '@/pages/client/BrandHub'
import ClientContentCalendar from '@/pages/client/ContentCalendar'
import ClientSettings from '@/pages/client/ClientSettings'
import DiscoveryLayout from '@/pages/client/discovery/DiscoveryLayout'
import DiscoveryDashboard from '@/pages/client/discovery/DiscoveryDashboard'
import DiscoveryAnswers from '@/pages/client/discovery/DiscoveryAnswers'
import DiscoveryStrategy from '@/pages/client/discovery/DiscoveryStrategy'
import DiscoverySession from '@/pages/client/discovery/DiscoverySession'

export default function App() {
  const { clientsLoading, clients } = useApp()
  const { profile } = useAuth()
  const location = useLocation()

  if (clientsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  // A real client account is confined to their own client subtree — this is
  // UX/routing convenience only, the actual security boundary is RLS.
  if (profile?.role === 'client') {
    if (!profile.client_id) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 text-center text-sm text-ink-muted">
          This account isn't linked to a client yet — ask Onwun to fix the invite.
        </div>
      )
    }
    const myClient = clients.find((c) => c.id === String(profile.client_id))
    if (!myClient) {
      // Their client didn't come back from the initial fetch (RLS or a
      // network error) — show that plainly instead of redirecting into
      // ClientLayout, which would just bounce back out to "/" and loop
      // forever with this guard redirecting back here.
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 text-center text-sm text-ink-muted">
          Couldn't load your project data. Try reloading — if this keeps happening, let Onwun know.
        </div>
      )
    }
    const ownPrefix = `/clients/${profile.client_id}`
    if (!location.pathname.startsWith(ownPrefix)) {
      return <Navigate to={`${ownPrefix}/dashboard`} replace />
    }
  }

  return (
    <ViewModeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/updates" element={<StudioUpdates />} />
          <Route path="/tasks" element={<StudioTasks />} />
          <Route path="/calendar" element={<StudioCalendar />} />
          <Route path="/clients/:clientId" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="updates" element={<ClientUpdates />} />
            <Route path="tasks" element={<ClientTasks />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="documents/:docId" element={<DocumentDetail />} />
            <Route path="library" element={<ClientLibrary />} />
            <Route path="library/:folderId" element={<ClientLibraryFolder />} />
            <Route path="discovery" element={<DiscoveryLayout />}>
              <Route index element={<DiscoveryDashboard />} />
              <Route path="answers" element={<DiscoveryAnswers />} />
              <Route path="strategy" element={<DiscoveryStrategy />} />
            </Route>
            <Route path="discovery/session" element={<DiscoverySession />} />
            <Route path="brand-hub" element={<ClientBrandHub />} />
            <Route path="content-calendar" element={<ClientContentCalendar />} />
            <Route path="settings" element={<ClientSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ViewModeProvider>
  )
}
