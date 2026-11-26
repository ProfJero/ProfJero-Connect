import { Wallet as WalletIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { BalanceCard } from '../../components/wallet/BalanceCard';
import { UsageOverviewCard } from '../../components/wallet/UsageOverviewCard';
import { LowBalanceAlertCard } from '../../components/wallet/LowBalanceAlertCard';
import { WalletActivityTable } from '../../components/wallet/WalletActivityTable';
import { RecentPayments } from '../../components/add-funds/RecentPayments';

export function WalletPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      <PageHeader icon={WalletIcon} title="Wallet" subtitle="Your unit balance, usage and top-ups." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <BalanceCard />
        <UsageOverviewCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <WalletActivityTable />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <LowBalanceAlertCard />
          <RecentPayments />
        </div>
      </div>
    </main>
  );
}
