import { ArrowRightLeft } from 'lucide-react';
import { TransactionMetricCard } from '../../components/transactions/TransactionMetricCard';
import { TransactionsFilterBar } from '../../components/transactions/TransactionsFilterBar';
import { TransactionsTable } from '../../components/transactions/TransactionsTable';
import { transactionMetrics } from '../../mock/transactions';

export function TransactionsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1440px] w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
          <ArrowRightLeft className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Transactions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View your transaction history and track your spending.
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {transactionMetrics.map((metric) => (
          <TransactionMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <TransactionsFilterBar />
      <TransactionsTable />
    </main>
  );
}