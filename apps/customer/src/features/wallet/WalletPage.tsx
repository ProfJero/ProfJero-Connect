import { Wallet as WalletIcon } from 'lucide-react';
import { BalanceCard } from '../../components/wallet/BalanceCard';
import { SpendingOverviewCard } from '../../components/wallet/SpendingOverviewCard';
import { WalletActivityTable } from '../../components/wallet/WalletActivityTable';

export function WalletPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a6cf0] flex items-center justify-center text-white shadow-xs shrink-0">
          <WalletIcon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Wallet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Manage your balance, track transactions and top up your wallet.
          </p>
        </div>
      </div>

      {/* Top row: balance + spending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <BalanceCard />
        <SpendingOverviewCard />
      </div>

      {/* Activity table */}
      <WalletActivityTable />
    </main>
  );
}