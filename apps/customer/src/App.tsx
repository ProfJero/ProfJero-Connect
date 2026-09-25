import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SendSmsPage } from './features/send-sms/SendSmsPage';
import { PlaceholderPage } from './features/PlaceholderPage';
import { SignupPage } from './features/auth/SignupPage';
import { ContactsPage } from './features/contacts/ContactsPage';
import { ContactGroupsPage } from './features/contacts/ContactGroupsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected app */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/messaging/sms" element={<SendSmsPage />} />
                <Route path="/messaging/bulk-sms" element={<PlaceholderPage title="Bulk SMS" />} />
                <Route path="/messaging/sender-ids" element={<PlaceholderPage title="Sender IDs" />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/contacts/groups" element={<ContactGroupsPage />} />
                <Route path="/services/data" element={<PlaceholderPage title="Data" />} />
                <Route path="/services/airtime" element={<PlaceholderPage title="Airtime" />} />
                <Route path="/wallet" element={<PlaceholderPage title="Wallet" />} />
                <Route path="/transactions" element={<PlaceholderPage title="Transactions" />} />
                <Route path="/api" element={<PlaceholderPage title="API & Integrations" />} />
                <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
                <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}