import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { SmsLogsPage } from './features/sms-logs/SmsLogsPage';
import { ComingSoon } from './features/ComingSoon';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/sms-logs" element={<SmsLogsPage />} />
          <Route path="/wallets" element={<ComingSoon title="Wallets & Units" />} />
          <Route path="/payments" element={<ComingSoon title="Payments" />} />
          <Route path="/arkesel" element={<ComingSoon title="Arkesel Account" />} />
          <Route path="/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}