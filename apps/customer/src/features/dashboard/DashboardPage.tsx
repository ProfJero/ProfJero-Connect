import { WelcomeHeader } from '../../components/dashboard/WelcomeHeader';
import { BalanceCard } from '../../components/dashboard/BalanceCard';
import { QuickActionsCard } from '../../components/dashboard/QuickActionsCard';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { SmsUsageChart } from '../../components/dashboard/SmsUsageChart';
import { RecentTransactions } from '../../components/dashboard/RecentTransactions';
import { ServiceOverview } from '../../components/dashboard/ServiceOverview';
import { RecentNotifications } from '../../components/dashboard/RecentNotifications';
import { ApiBanner } from '../../components/dashboard/ApiBanner';
import { metricCards } from '../../mock/dashboard';

export function DashboardPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto w-full flex-1">
      <WelcomeHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BalanceCard />
        <QuickActionsCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <SmsUsageChart />
          <RecentTransactions />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ServiceOverview />
          <RecentNotifications />
          <ApiBanner />
        </div>
      </div>
    </main>
  );
}