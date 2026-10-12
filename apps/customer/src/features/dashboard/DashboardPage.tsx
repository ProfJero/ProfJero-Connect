import { WelcomeHeader } from '../../components/dashboard/WelcomeHeader';
import { BalanceCard } from '../../components/dashboard/BalanceCard';
import { QuickActionsCard } from '../../components/dashboard/QuickActionsCard';
import { SmsUsageChart } from '../../components/dashboard/SmsUsageChart';
import { ServiceLauncher } from '../../components/dashboard/ServiceLauncher';
import { AccountOverview, AttentionStrip } from '../../components/dashboard/AccountOverview';
import { RecentNotifications } from '../../components/dashboard/RecentNotifications';
import { ApiBanner } from '../../components/dashboard/ApiBanner';
import { useApi } from '../../lib/useApi';
import type { SmsStats } from '../../lib/types';

/**
 * Home: what to do next, every service, then an overview across services.
 * Service-specific detail (SMS balance, usage) comes after the overview,
 * so the account never reads as "SMS only".
 */
export function DashboardPage() {
  const stats = useApi<SmsStats>('/customer/sms/stats?days=30');

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto w-full flex-1">
      <WelcomeHeader />
      <AttentionStrip />
      <ServiceLauncher />
      <AccountOverview />

      <section aria-labelledby="sms-detail" className="space-y-4">
        <h2 id="sms-detail" className="text-sm font-bold text-slate-900 dark:text-slate-100">Bulk SMS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <BalanceCard />
          <QuickActionsCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SmsUsageChart stats={stats.data} loading={stats.loading} />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <RecentNotifications />
            <ApiBanner />
          </div>
        </div>
      </section>
    </main>
  );
}
