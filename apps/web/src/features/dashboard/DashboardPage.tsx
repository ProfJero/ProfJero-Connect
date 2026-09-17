import { StatCard } from '../../components/dashboard/StatCard';
import { SmsUsageChart } from '../../components/dashboard/SmsUsageChart';
import { PlatformDonutChart } from '../../components/dashboard/PlatformDonutChart';
import { ProjectsTable } from '../../components/dashboard/ProjectsTable';
import { RecentSmsLogs } from '../../components/dashboard/RecentSmsLogs';
import { RecentPayments } from '../../components/dashboard/RecentPayments';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { LowBalanceAlerts } from '../../components/dashboard/LowBalanceAlerts';
import { QuickStats } from '../../components/dashboard/QuickStats';
import { ArkeselStatus } from '../../components/dashboard/ArkeselStatus';
import { stats } from '../../mock/dashboard';

export function DashboardPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Metrics */}
      <section aria-label="Metrics Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} stat={s} />
          ))}
        </div>
      </section>

      {/* Charts + tables + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmsUsageChart />
            <PlatformDonutChart />
          </div>
          <ProjectsTable />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentSmsLogs />
            <RecentPayments />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <RecentActivity />
          <LowBalanceAlerts />
          <QuickStats />
          <ArkeselStatus />
        </div>
      </div>
    </main>
  );
}