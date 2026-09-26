import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MessagingOverviewPage } from './features/messaging/MessagingOverviewPage';
import { CampaignsPage } from './features/messaging/CampaignsPage';
import { MessageHistoryPage } from './features/messaging/MessageHistoryPage';
import { SendSmsPage } from './features/send-sms/SendSmsPage';
import { ContactsPage } from './features/contacts/ContactsPage';
import { ContactGroupsPage } from './features/contacts/ContactGroupsPage';
import { PlaceholderPage } from './features/PlaceholderPage';
import { WalletPage } from './features/wallet/WalletPage';
import { ServicesPage } from './features/services/ServicesPage';
import { RequestSenderIdPage } from './features/sender-ids/RequestSenderIdPage';
import { SenderIdsPage } from './features/sender-ids/SenderIdsPage';
import { AddFundsPage } from './features/wallet/AddFundsPage';
import { AddFundsPage } from './features/wallet/AddFundsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Messaging */}
                <Route path="/messaging" element={<MessagingOverviewPage />} />
                <Route path="/messaging/sms" element={<SendSmsPage />} />
                <Route path="/messaging/bulk-sms" element={<PlaceholderPage title="Bulk SMS" />} />
                <Route path="/messaging/sender-ids" element={<SenderIdsPage />} />
                <Route path="/messaging/sender-ids/request" element={<RequestSenderIdPage />} />
                <Route path="/messaging/campaigns" element={<CampaignsPage />} />
                <Route path="/messaging/history" element={<MessageHistoryPage />} />

                {/* Contacts */}
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/contacts/groups" element={<ContactGroupsPage />} />

                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/data" element={<PlaceholderPage title="Data" />} />
                <Route path="/services/airtime" element={<PlaceholderPage title="Airtime" />} />

                {/* Other */}
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/wallet/add-funds" element={<AddFundsPage />} />
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