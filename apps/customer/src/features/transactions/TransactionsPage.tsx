import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataOrdersTable } from '../../components/data/DataOrdersTable';
import { ArrowRightLeft, Wallet, CalendarDays, Package, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { TransactionsTable } from '../../components/transactions/TransactionsTable';
import { RecentPayments } from '../../components/add-funds/RecentPayments';
import { ErrorState } from '../../components/ui/States';
import { useApi } from '../../lib/useApi';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerPayment, DataOrder } from '../../lib/types';

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

const TABS = [
  { id: 'sms', label: 'SMS wallet' },
  { id: 'data', label: 'Data bundles' },
] as const;

/** Everything the customer has bought, one tab per service. */
export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'data' ? 'data' : 'sms';
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1440px] w-full mx-auto">
      <PageHeader icon={ArrowRightLeft} title="Purchase history" subtitle="Everything you've bought and every change to your SMS wallet." />
      <nav aria-label="Purchase type" className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setParams(t.id === 'sms' ? {} : { tab: t.id }, { replace: true })}
            className={cn(
              '-mb-px px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              tab === t.id ? 'border-[#1a6cf0] text-[#1764e0] dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'sms' ? <SmsWalletHistory /> : <DataHistory />}
    </main>
  );
}

function DataHistory() {
  const { data, loading, error, refresh } = useApi<{ orders: DataOrder[] }>('/customer/data/orders?limit=100');
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to="/services/data" className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">Buy data →</Link>
      </div>
      <DataOrdersTable orders={data?.orders ?? []} loading={loading && !data} error={error && !data ? error : null} onRetry={refresh} />
    </div>
  );
}

function SmsWalletHistory() {
  const payments = useApi<{ payments: CustomerPayment[]; summary: PaymentsSummary }>('/customer/payments?limit=1');
  const [filter, setFilter] = useState(0);
  const s = payments.data?.summary;
  const loading = payments.loading && !payments.data;
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      {payments.error ? (
        <ErrorState error={payments.error} onRetry={payments.refresh} className="m-0" />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            loading={loading}
            metric={{ label: 'SMS top-ups', value: formatGhs(s?.totalPaidGhs ?? 0), footer: `${s?.successfulCount ?? 0} payments, all time`, icon: Wallet, iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-[#1764e0] dark:text-blue-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'This month', value: formatGhs(s?.paidThisMonthGhs ?? 0), footer: monthLabel, icon: CalendarDays, iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-700 dark:text-emerald-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'Units purchased', value: (s?.totalUnitsPurchased ?? 0).toLocaleString(), footer: 'all time', icon: Package, iconBg: 'bg-purple-50 dark:bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400' }}
          />
          <MetricCard
            loading={loading}
            metric={{ label: 'Pending payments', value: (s?.pendingCount ?? 0).toLocaleString(), footer: 'awaiting confirmation', icon: Clock, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-700 dark:text-amber-400' }}
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
    </>
  );
}
