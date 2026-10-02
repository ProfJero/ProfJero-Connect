import { Link } from 'react-router-dom';
import { Inbox, Mail, Plus, RotateCcw, Settings as SettingsIcon, type LucideIcon } from 'lucide-react';
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
  shortRef,
  type DisplayTxType,
} from '../../lib/format';
import { cn } from '../../lib/utils';

const TYPE_STYLES: Record<
  DisplayTxType,
  { bg: string; text: string; icon: LucideIcon }
> = {
  'Wallet Funding': {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: Plus,
  },
  SMS: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Mail,
  },
  Refund: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    icon: RotateCcw,
  },
  Adjustment: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    icon: SettingsIcon,
  },
};

const STATUS_STYLES = {
  Completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-500/20',
  },
} as const;

export function TransactionsTable({ types }: { types?: string }) {
  const { transactions, loading, loadingMore, error, hasMore, loadMore } =
    useTransactions({ limit: 20, types });
  const rows = transactions.filter(isDisplayable);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-[#1a6cf0] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-10 px-5 text-center text-xs text-rose-600 dark:text-rose-400">
          Could not load transactions. Refresh to try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <Inbox
            className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {types ? 'No transactions of this type' : 'No transactions yet'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Your transaction history will appear here.
          </p>
        </div>
      ) : (
        <TableScroll>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6 whitespace-nowrap">Date</th>
                <th className="py-4 px-6 whitespace-nowrap">Reference</th>
                <th className="py-4 px-6 whitespace-nowrap">Type</th>
                <th className="py-4 px-6 whitespace-nowrap">Description</th>
                <th className="py-4 px-6 whitespace-nowrap">Amount</th>
                <th className="py-4 px-6 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {rows.map((tx) => {
                const type = getDisplayType(tx);
                const typeStyle = TYPE_STYLES[type];
                const TypeIcon = typeStyle.icon;
                const amount = getAmount(tx);
                const status = getStatus(tx);
                const statusStyle = STATUS_STYLES[status];
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {shortRef(tx.id)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
                          typeStyle.bg,
                          typeStyle.text,
                        )}
                      >
                        <TypeIcon className="w-3 h-3" strokeWidth={2} />
                        {type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {getTxLink(tx) ? (
                        <Link to={getTxLink(tx)!} className="hover:text-[#1a6cf0] hover:underline">
                          {getDisplayDescription(tx)}
                        </Link>
                      ) : (
                        getDisplayDescription(tx)
                      )}
                    </td>
                    <td
                      className={cn(
                        'py-4 px-6 font-semibold whitespace-nowrap',
                        amount.positive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400',
                      )}
                    >
                      {amount.text}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                          statusStyle.bg,
                          statusStyle.text,
                          statusStyle.border,
                        )}
                      >
                        {status}
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
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