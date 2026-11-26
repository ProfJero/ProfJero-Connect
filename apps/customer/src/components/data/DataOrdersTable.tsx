import { Link } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { DataOrderBadge } from './DataOrderBadge';
import { TableScroll } from '../ui/TableScroll';
import { formatDateTime, formatGhs, formatPhone } from '../../lib/format';
import { networkStyle } from '../../lib/services';
import { errorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { DataOrder } from '../../lib/types';

export function DataOrdersTable({
  orders,
  loading,
  error,
  onRetry,
}: {
  orders: DataOrder[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {error ? (
        <p role="alert" className="p-6 text-sm text-slate-600 dark:text-slate-300">
          {errorMessage(error)} <button type="button" onClick={onRetry} className="font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">Try again</button>
        </p>
      ) : loading ? (
        <div className="p-5 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-10 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center">
          <Wifi className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          <h2 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">No data orders yet</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buy a bundle for any MTN, Telecel or AirtelTigo number — it arrives in seconds.</p>
          <Link to="/services/data" className="mt-4 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg">Buy data</Link>
        </div>
      ) : (
        <TableScroll label="Data orders">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Bundle</th>
                <th scope="col" className="px-4 py-3 font-semibold">Number</th>
                <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <Link to={`/services/data/orders/${o.id}`} className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 hover:underline">
                      <span className={cn('px-1.5 py-px rounded text-[9px] font-bold', networkStyle(o.network).chip)}>{o.network}</span>
                      {o.size}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatPhone(o.recipientNumber)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{formatGhs(o.amountGhs)}</td>
                  <td className="px-4 py-3"><DataOrderBadge order={o} /></td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/services/data?bundle=${encodeURIComponent(o.bundleId)}&number=${encodeURIComponent(o.recipientNumber)}`}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                      aria-label={`Buy ${o.size} again for ${formatPhone(o.recipientNumber)}`}
                    >
                      Buy again
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </section>
  );
}
