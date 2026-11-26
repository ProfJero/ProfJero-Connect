import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PAYMENT_STATUS } from '../../lib/statusLabels';
import { ErrorState, SkeletonRows } from '../ui/States';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useRefreshAccount } from '../../lib/account';
import { formatDateTime, formatGhs } from '../../lib/format';
import type { CustomerPayment } from '../../lib/types';


/** Last few top-ups, with a re-check for ones still pending. */
export function RecentPayments() {
  const { data, loading, error, refresh } = useApi<{ payments: CustomerPayment[] }>(
    '/customer/payments?limit=5',
  );
  const refreshAccount = useRefreshAccount();
  const [checking, setChecking] = useState<string | null>(null);

  const recheck = async (reference: string) => {
    setChecking(reference);
    try {
      const res = await api.post<{ walletCredited: boolean }>(
        `/customer/payments/${encodeURIComponent(reference)}/verify`,
      );
      if (res.walletCredited) refreshAccount();
    } catch {
      /* The row keeps its status; the webhook remains the source of truth. */
    } finally {
      setChecking(null);
      refresh();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent top-ups</h3>
      </div>
      {loading && !data ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : !data || data.payments.length === 0 ? (
        <p className="px-5 py-6 text-xs text-slate-500 dark:text-slate-400">No top-ups yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.payments.map((p) => {
            const s = PAYMENT_STATUS[p.status];
            return (
              <li key={p.reference} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatGhs(p.amountGhs)} · {p.units.toLocaleString()} units
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-500">{formatDateTime(p.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => recheck(p.reference)}
                      disabled={checking === p.reference}
                      className="text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:underline disabled:opacity-50"
                    >
                      {checking === p.reference ? 'Checking…' : 'Check status'}
                    </button>
                  )}
                  <Badge tone={s.tone} label={s.label} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
        <Link to="/transactions" className="text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
          View all transactions →
        </Link>
      </div>
    </div>
  );
}
