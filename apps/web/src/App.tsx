import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { ProjectDetailsPage } from './features/projects/ProjectDetailsPage';
import { ApiKeysPage } from './features/api-keys/ApiKeysPage';
import { SenderIdsPage } from './features/sender-ids/SenderIdsPage';
import { PricingPage } from './features/pricing/PricingPage';
import { SmsLogsPage } from './features/sms-logs/SmsLogsPage';
import { WalletsPage } from './features/wallets/WalletsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { ProvidersListPage } from './features/providers/ProvidersListPage';
import { ProviderDetailPage } from './features/providers/ProviderDetailPage';
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

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route
                path="/projects/:id/api-keys"
                element={<ApiKeysPage />}
              />
              <Route path="/sender-ids" element={<SenderIdsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/sms-logs" element={<SmsLogsPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/providers" element={<ProvidersListPage />} />
              <Route
                path="/providers/:providerId"
                element={<ProviderDetailPage />}
              />
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