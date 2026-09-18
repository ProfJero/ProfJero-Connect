import { MetricCard } from '../../components/wallets/MetricCard';
import { ProjectsWalletsTable } from '../../components/wallets/ProjectsWalletsTable';
import { LowBalanceProjects } from '../../components/wallets/LowBalanceProjects';
import { UnitDistribution } from '../../components/wallets/UnitDistribution';
import { TransactionHistory } from '../../components/wallets/TransactionHistory';
import { QuickActionsCard } from '../../components/wallets/QuickActionsCard';
import { walletMetrics } from '../../mock/wallets';

export function WalletsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {walletMetrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ProjectsWalletsTable />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <LowBalanceProjects />
          <UnitDistribution />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <TransactionHistory />
        </div>
        <div className="lg:col-span-4">
          <QuickActionsCard />
        </div>
      </section>
    </main>
  );
}