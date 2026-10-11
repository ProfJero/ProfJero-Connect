import { Link } from 'react-router-dom';
import { ShoppingBag, Wifi } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataOrdersTable } from '../../components/data/DataOrdersTable';
import { useApi } from '../../lib/useApi';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { DataOrder } from '../../lib/types';

export function DataOrdersPage() {
  const { data, loading, error, refresh } = useApi<{ orders: DataOrder[]; nextCursor: string | null }>('/customer/data/orders?limit=100');
  const orders = data?.orders ?? [];
  const delivered = orders.filter((o) => o.orderStatus === 'delivered');
  const spent = delivered.reduce((s, o) => s + o.amountGhs, 0);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        icon={ShoppingBag}
        title="My data orders"
        subtitle="Every bundle you've bought, and where it is now."
        actions={
          <Link to="/services/data" className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg">
            <Wifi className="w-4 h-4" strokeWidth={2} /> Buy data
          </Link>
        }
      />

      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Bundles delivered" value={delivered.length.toLocaleString()} />
          <Stat label="Spent on data" value={formatGhs(spent)} />
          <Stat label="Numbers topped up" value={new Set(delivered.map((o) => o.recipientNumber)).size.toLocaleString()} className="hidden sm:block" />
        </div>
      )}

      <DataOrdersTable orders={orders} loading={loading && !data} error={error && !data ? error : null} onRetry={refresh} />
    </main>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4', className)}>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
