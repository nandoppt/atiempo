import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import ClientLayout from './components/ClientLayout';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import CalendarView from './components/CalendarView';
import ChatbotConfig from './components/ChatbotConfig';
import ConnectionsConfig from './components/ConnectionsConfig';
import AppointmentList from './components/AppointmentList';

export default function App() {
  const [userType, setUserType] = useState<'admin' | 'client' | null>(null);

  const handleLogin = (type: 'admin' | 'client') => {
    setUserType(type);
  };

  const handleLogout = () => {
    setUserType(null);
  };

  if (!userType) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {userType === 'admin' ? (
          <Route path="/" element={<AdminLayout onLogout={handleLogout} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="appointments" element={<AppointmentList userType="admin" />} />
            <Route path="chatbot" element={<ChatbotConfig />} />
            <Route path="connections" element={<ConnectionsConfig />} />
          </Route>
        ) : (
          <Route path="/" element={<ClientLayout onLogout={handleLogout} />}>
            <Route index element={<ClientDashboard />} />
            <Route path="appointments" element={<AppointmentList userType="client" />} />
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
