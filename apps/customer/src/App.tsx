import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PlaceholderPage } from './features/PlaceholderPage';
import { SendSmsPage } from './features/send-sms/SendSmsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/messaging/sms" element={<SendSmsPage />} />
              <Route path="/messaging/bulk-sms" element={<PlaceholderPage title="Bulk SMS" />} />
              <Route path="/messaging/sender-ids" element={<PlaceholderPage title="Sender IDs" />} />
              <Route path="/contacts" element={<PlaceholderPage title="Contacts" />} />
              <Route path="/services/data" element={<PlaceholderPage title="Data" />} />
              <Route path="/services/airtime" element={<PlaceholderPage title="Airtime" />} />
              <Route path="/wallet" element={<PlaceholderPage title="Wallet" />} />
              <Route path="/transactions" element={<PlaceholderPage title="Transactions" />} />
              <Route path="/api" element={<PlaceholderPage title="API & Integrations" />} />
              <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}