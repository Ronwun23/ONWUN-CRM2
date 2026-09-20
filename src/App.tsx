import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import { ViewModeProvider } from '@/context/ViewModeContext'
import HomePage from '@/pages/Home'
import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/Dashboard'
import ClientUpdates from '@/pages/client/Updates'
import ClientTasks from '@/pages/client/Tasks'
import ClientDocuments from '@/pages/client/Documents'
import DocumentDetail from '@/pages/client/DocumentDetail'
import ClientLibrary from '@/pages/client/Library'
import ClientBrandHub from '@/pages/client/BrandHub'
import ClientSettings from '@/pages/client/ClientSettings'
import DiscoveryLayout from '@/pages/client/discovery/DiscoveryLayout'
import DiscoveryDashboard from '@/pages/client/discovery/DiscoveryDashboard'
import DiscoveryAnswers from '@/pages/client/discovery/DiscoveryAnswers'
import DiscoveryStrategy from '@/pages/client/discovery/DiscoveryStrategy'
import DiscoverySession from '@/pages/client/discovery/DiscoverySession'

export default function App() {
  return (
    <ViewModeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clients/:clientId" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="updates" element={<ClientUpdates />} />
            <Route path="tasks" element={<ClientTasks />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="documents/:docId" element={<DocumentDetail />} />
            <Route path="library" element={<ClientLibrary />} />
            <Route path="discovery" element={<DiscoveryLayout />}>
              <Route index element={<DiscoveryDashboard />} />
              <Route path="answers" element={<DiscoveryAnswers />} />
              <Route path="strategy" element={<DiscoveryStrategy />} />
            </Route>
            <Route path="discovery/session" element={<DiscoverySession />} />
            <Route path="brand-hub" element={<ClientBrandHub />} />
            <Route path="settings" element={<ClientSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ViewModeProvider>
  )
}
