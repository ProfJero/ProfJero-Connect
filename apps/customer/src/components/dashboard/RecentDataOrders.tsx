import { Link } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { formatGhs, formatPhone, timeAgo } from '../../lib/format';
import { DataOrderBadge } from '../data/DataOrderBadge';
import type { DataOrder } from '../../lib/types';

/** Latest data bundle purchases, with a nudge to buy when there are none. */
export function RecentDataOrders() {
  const { data, loading } = useApi<{ orders: DataOrder[] }>('/customer/data/orders?limit=4');
  const orders = data?.orders ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Data purchases</h3>
        <Link to="/services/data/orders" className="text-[#1764e0] dark:text-blue-400 hover:underline text-xs font-medium">
          View all →
        </Link>
      </div>
      {loading && !data ? (
        <div className="mt-3 space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4" strokeWidth={2} />
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex-1">
            Buy data for yourself, your team or your customers — delivered in seconds.
          </p>
          <Link to="/services/data" className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0">
            Buy data
          </Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/services/data/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{o.bundleLabel}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {formatPhone(o.recipientNumber)} · {timeAgo(o.createdAt)}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatGhs(o.amountGhs)}</span>
                  <DataOrderBadge order={o} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
