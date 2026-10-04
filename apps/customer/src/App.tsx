import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RouteTitle } from './components/RouteTitle';
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
import { ComingSoonPage } from './features/ComingSoonPage';
import { WalletPage } from './features/wallet/WalletPage';
import { ServicesPage } from './features/services/ServicesPage';
import { RequestSenderIdPage } from './features/sender-ids/RequestSenderIdPage';
import { SenderIdsPage } from './features/sender-ids/SenderIdsPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { AddFundsPage } from './features/wallet/AddFundsPage';
import { ApiPage } from './features/api/ApiPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { CompleteSetupPage } from './features/auth/CompleteSetupPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { AddFundsCompletePage } from './features/wallet/AddFundsCompletePage';
import { BatchDetailPage } from './features/messaging/BatchDetailPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouteTitle />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/complete-setup" element={<CompleteSetupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Messaging */}
                <Route path="/messaging" element={<MessagingOverviewPage />} />
                <Route path="/messaging/sms" element={<SendSmsPage />} />
                <Route path="/messaging/bulk-sms" element={<Navigate to="/messaging/sms" replace />} />
                <Route path="/messaging/sender-ids" element={<SenderIdsPage />} />
                <Route path="/messaging/sender-ids/request" element={<RequestSenderIdPage />} />
                <Route path="/messaging/campaigns" element={<CampaignsPage />} />
                <Route path="/messaging/history" element={<MessageHistoryPage />} />
                <Route path="/messaging/history/:batchId" element={<BatchDetailPage />} />

                {/* Contacts */}
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/contacts/groups" element={<ContactGroupsPage />} />

                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route
                  path="/services/data"
                  element={<ComingSoonPage title="Data" description="Buy data bundles for MTN, Telecel and AirtelTigo numbers straight from your wallet." />}
                />
                <Route
                  path="/services/airtime"
                  element={<ComingSoonPage title="Airtime" description="Top up any Ghanaian mobile number with airtime straight from your wallet." />}
                />

                {/* Other */}
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/wallet/add-funds" element={<AddFundsPage />} />
                <Route path="/wallet/add-funds/complete" element={<AddFundsCompletePage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/api" element={<ApiPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/organisation" element={<Navigate to="/settings?tab=organisation" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}