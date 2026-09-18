import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { SmsLogsPage } from './features/sms-logs/SmsLogsPage';
import { WalletsPage } from './features/wallets/WalletsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { ArkeselPage } from './features/arkesel/ArkeselPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/sms-logs" element={<SmsLogsPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/arkesel" element={<ArkeselPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}