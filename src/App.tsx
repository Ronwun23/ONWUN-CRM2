import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/Home'
import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/Dashboard'
import ClientUpdates from '@/pages/client/Updates'
import ClientTasks from '@/pages/client/Tasks'
import ClientDocuments from '@/pages/client/Documents'
import ClientLibrary from '@/pages/client/Library'
import ClientDiscovery from '@/pages/client/Discovery'
import ClientBrandHub from '@/pages/client/BrandHub'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients/:clientId" element={<ClientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="updates" element={<ClientUpdates />} />
          <Route path="tasks" element={<ClientTasks />} />
          <Route path="documents" element={<ClientDocuments />} />
          <Route path="library" element={<ClientLibrary />} />
          <Route path="discovery" element={<ClientDiscovery />} />
          <Route path="brand-hub" element={<ClientBrandHub />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
