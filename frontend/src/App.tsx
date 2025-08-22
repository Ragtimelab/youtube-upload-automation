import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ScriptsPage } from '@/pages/ScriptsPage'
import { UploadPage } from '@/pages/UploadPage'
import { YouTubePage } from '@/pages/YouTubePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StatusPage } from '@/pages/StatusPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <QueryProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scripts" element={<ScriptsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/youtube" element={<YouTubePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryProvider>
  )
}

export default App
