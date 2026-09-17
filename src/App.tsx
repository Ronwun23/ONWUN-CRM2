import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import LeadsPage from '@/pages/Leads'
import PipelinePage from '@/pages/Pipeline'
import AnalyticsPage from '@/pages/Analytics'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/leads" replace />} />
      </Routes>
    </Layout>
  )
}
