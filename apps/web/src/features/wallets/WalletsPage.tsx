import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { MetricCard, type Metric } from '../../components/wallets/MetricCard';
import { ProjectsWalletsTable } from '../../components/wallets/ProjectsWalletsTable';
import { LowBalanceProjects } from '../../components/wallets/LowBalanceProjects';
import { UnitDistribution } from '../../components/wallets/UnitDistribution';
import { TransactionHistory } from '../../components/wallets/TransactionHistory';
import {
  QuickActionsCard,
  type WalletQuickAction,
} from '../../components/wallets/QuickActionsCard';
import {
  WalletActionModal,
  type WalletActionMode,
} from '../../components/wallets/WalletActionModal';
import { useApi } from '../../lib/useApi';
import type {
  WalletListResponse,
  WalletTransactionListResponse,
} from '@profjero/shared';

const DEFAULT_LOW_BALANCE_THRESHOLD = 500;

export function WalletsPage() {
  const navigate = useNavigate();
  const walletsApi = useApi<WalletListResponse>('/admin/wallets');
  const txApi = useApi<WalletTransactionListResponse>(
    '/admin/wallets/transactions?limit=50',
  );

  const entries = walletsApi.data?.wallets ?? [];
  const transactions = txApi.data?.transactions ?? [];

  const [modalMode, setModalMode] = useState<WalletActionMode | null>(null);
  const txSectionRef = useRef<HTMLElement>(null);

  const reloadAll = () => {
    walletsApi.reload();
    txApi.reload();
  };

  const handleQuickAction = (action: WalletQuickAction) => {
    if (action === 'view-history') {
      txSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setModalMode(action);
  };

  // Wallet thresholds: use each wallet's own lowBalanceThreshold when set,
  // otherwise fall back to the default. Critical is always the absolute floor.
  const lowBalanceCount = entries.filter((e) => {
    const t = e.wallet.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD;
    return e.wallet.availableUnits > 0 && e.wallet.availableUnits < t;
  }).length;

  const totalAvailable = entries.reduce(
    (sum, e) => sum + e.wallet.availableUnits,
    0,
  );
  const totalReserved = entries.reduce(
    (sum, e) => sum + e.wallet.reservedUnits,
    0,
  );
  const fundedCount = entries.filter((e) => e.wallet.availableUnits > 0).length;

  const metrics: Metric[] = [
    {
      label: 'Total Available',
      value: totalAvailable.toLocaleString(),
      footnote: 'Units ready to spend',
      icon: 'wallet',
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Total Reserved',
      value: totalReserved.toLocaleString(),
      footnote: 'Held for in-flight SMS',
      icon: 'lock',
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Funded Wallets',
      value: String(fundedCount),
      footnote: `of ${entries.length} projects`,
      icon: 'activity',
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Low Balance',
      value: String(lowBalanceCount),
      footnote: 'Below each wallet threshold',
      icon: 'alert',
      iconBg: 'bg-rose-500',
    },
  ];

  const loading = walletsApi.loading || txApi.loading;
  const error = walletsApi.error || txApi.error;

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <h1 className="sr-only">Wallets &amp; Units</h1>
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load wallets.</div>
            <div className="mt-0.5 opacity-80">{error.message}</div>
          </div>
          <button
            onClick={reloadAll}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !walletsApi.data
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200/90 shadow-xs animate-pulse"
              />
            ))
          : metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ProjectsWalletsTable entries={entries} />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <LowBalanceProjects
            entries={entries}
            onProjectClick={(id) => navigate(`/projects/${id}`)}
          />
          <UnitDistribution entries={entries} />
        </div>
      </section>

      <section
        ref={txSectionRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-6"
      >
        <div className="lg:col-span-8">
          <TransactionHistory
            transactions={transactions}
            total={transactions.length}
          />
        </div>
        <div className="lg:col-span-4">
          <QuickActionsCard onAction={handleQuickAction} />
        </div>
      </section>

      <WalletActionModal
        open={modalMode !== null}
        mode={modalMode ?? 'credit'}
        entries={entries}
        onClose={() => setModalMode(null)}
        onSaved={() => {
          setModalMode(null);
          reloadAll();
        }}
      />
    </main>
  );
}