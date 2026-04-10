import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../lib/AuthContext'
import LoginPage from './components/LoginPage'
import AdminLayout from './components/AdminLayout'
import ClientLayout from './components/ClientLayout'
import AdminDashboard from './components/AdminDashboard'
import ClientDashboard from './components/ClientDashboard'
import CalendarView from './components/CalendarView'
import ChatbotConfig from './components/ChatbotConfig'
import ConnectionsConfig from './components/ConnectionsConfig'
import AppointmentList from './components/AppointmentList'
import { Loader2 } from 'lucide-react'

function AppRoutes() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user || !role) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        {role === 'admin' ? (
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="appointments" element={<AppointmentList userType="admin" />} />
            <Route path="chatbot" element={<ChatbotConfig />} />
            <Route path="connections" element={<ConnectionsConfig />} />
          </Route>
        ) : (
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="appointments" element={<AppointmentList userType="client" />} />
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
