import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { ProjectDetailsPage } from './features/projects/ProjectDetailsPage';
import { SmsLogsPage } from './features/sms-logs/SmsLogsPage';
import { WalletsPage } from './features/wallets/WalletsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { ArkeselPage } from './features/arkesel/ArkeselPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SendSmsPage } from './features/send-sms/SendSmsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — anything not logged in redirects to /login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/sms-logs" element={<SmsLogsPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/arkesel" element={<ArkeselPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/send-sms" element={<SendSmsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}