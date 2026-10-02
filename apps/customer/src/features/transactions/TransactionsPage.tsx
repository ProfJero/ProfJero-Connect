import { useState } from 'react';
import { ArrowRightLeft, Wallet, CalendarDays, Package, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { TransactionsTable } from '../../components/transactions/TransactionsTable';
import { RecentPayments } from '../../components/add-funds/RecentPayments';
import { ErrorState } from '../../components/ui/States';
import { useApi } from '../../lib/useApi';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerPayment } from '../../lib/types';

interface PaymentsSummary {
  totalPaidGhs: number;
  totalUnitsPurchased: number;
  paidThisMonthGhs: number;
  successfulCount: number;
  pendingCount: number;
}

const TYPE_FILTERS: Array<{ label: string; types?: string }> = [
  { label: 'All' },
  { label: 'Top-ups', types: 'purchase,manual_credit' },
  { label: 'SMS', types: 'reserve' },
  { label: 'Refunds', types: 'release,refund' },
  { label: 'Adjustments', types: 'manual_debit,reversal,adjustment' },
];

export function TransactionsPage() {
  const payments = useApi<{ payments: CustomerPayment[]; summary: PaymentsSummary }>('/customer/payments?limit=1');
  const [filter, setFilter] = useState(0);
  const s = payments.data?.summary;
  const loading = payments.loading && !payments.data;
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1440px] w-full mx-auto">
      <PageHeader icon={ArrowRightLeft} title="Transactions" subtitle="Every top-up, SMS charge and refund on your wallet." />

      {payments.error ? (
        <ErrorState error={payments.error} onRetry={payments.refresh} className="m-0" />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            loading={loading}
            metric={{ label: 'Total top-ups', value: formatGhs(s?.totalPaidGhs ?? 0), footer: `${s?.successfulCount ?? 0} payments, all time`, icon: Wallet, iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-[#1a6cf0] dark:text-blue-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'This month', value: formatGhs(s?.paidThisMonthGhs ?? 0), footer: monthLabel, icon: CalendarDays, iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'Units purchased', value: (s?.totalUnitsPurchased ?? 0).toLocaleString(), footer: 'all time', icon: Package, iconBg: 'bg-purple-50 dark:bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'Pending payments', value: (s?.pendingCount ?? 0).toLocaleString(), footer: 'awaiting confirmation', icon: Clock, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' }}
          />
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFilter(i)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
                  filter === i
                    ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <TransactionsTable types={TYPE_FILTERS[filter].types} />
        </div>
        <div className="xl:col-span-4">
          <RecentPayments />
        </div>
      </div>
    </main>
  );
}
