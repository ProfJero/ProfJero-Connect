import { Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Plus,
  RotateCcw,
  Settings as SettingsIcon,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import { useTransactions } from '../../lib/hooks';
import {
  isDisplayable,
  getDisplayType,
  getDisplayDescription,
  getAmount,
  getStatus,
  getTxLink,
  formatDateTime,
  type DisplayTxType,
} from '../../lib/format';
import { cn } from '../../lib/utils';

const TYPE_ICON: Record<DisplayTxType, { icon: LucideIcon; bg: string }> = {
  'Wallet Funding': { icon: Plus, bg: 'bg-emerald-500' },
  SMS: { icon: MessageSquare, bg: 'bg-blue-500' },
  Refund: { icon: RotateCcw, bg: 'bg-amber-500' },
  Adjustment: { icon: SettingsIcon, bg: 'bg-slate-500' },
};

export function WalletActivityTable() {
  const { transactions, loading, loadingMore, error, hasMore, loadMore } =
    useTransactions({ limit: 20 });
  const rows = transactions.filter(isDisplayable);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a6cf0] flex items-center justify-center text-white shrink-0">
          <FileText className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Wallet Activity
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            View your recent wallet transactions and balance changes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-[#1a6cf0] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-10 px-5 text-center text-xs text-rose-600 dark:text-rose-400">
          Could not load activity. Refresh to try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <Inbox
            className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            No wallet activity yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Your wallet transactions will appear here.
          </p>
        </div>
      ) : (
        <TableScroll>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/50">
                <th className="py-3 px-5 whitespace-nowrap">Description</th>
                <th className="py-3 px-5 whitespace-nowrap">Date &amp; Time</th>
                <th className="py-3 px-5 whitespace-nowrap">Amount</th>
                <th className="py-3 px-5 whitespace-nowrap">Balance After</th>
                <th className="py-3 px-5 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {rows.map((tx) => {
                const displayType = getDisplayType(tx);
                const { icon: Icon, bg } = TYPE_ICON[displayType];
                const amount = getAmount(tx);
                const status = getStatus(tx);
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0',
                            bg,
                          )}
                        >
                          <Icon className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                            {displayType}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {getTxLink(tx) ? (
                              <Link to={getTxLink(tx)!} className="hover:text-[#1a6cf0] hover:underline">
                                {getDisplayDescription(tx)}
                              </Link>
                            ) : (
                              getDisplayDescription(tx)
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td
                      className={cn(
                        'py-4 px-5 font-bold whitespace-nowrap',
                        amount.positive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400',
                      )}
                    >
                      {amount.text}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {tx.availableAfter.toLocaleString()} units
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        • {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      {hasMore && !loading && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:underline disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  );
}