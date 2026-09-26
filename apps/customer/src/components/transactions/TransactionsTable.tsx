import { MoreVertical } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import {
  transactions,
  transactionsPagination,
  TYPE_STYLES,
  type TransactionStatus,
} from '../../mock/transactions';
import { cn } from '../../lib/utils';

const STATUS_STYLES: Record<
  TransactionStatus,
  { bg: string; text: string; border: string }
> = {
  Completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-500/20',
  },
  Pending: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-500/20',
  },
  Failed: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-500/20',
  },
};

export function TransactionsTable() {
  const p = transactionsPagination;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
              <th className="py-4 px-6 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {transactions.map((row) => {
              const typeStyle = TYPE_STYLES[row.type];
              const statusStyle = STATUS_STYLES[row.status];
              const TypeIcon = typeStyle.icon;

              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {row.reference}
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
                      {row.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {row.description}
                  </td>
                  <td
                    className={cn(
                      'py-4 px-6 font-semibold whitespace-nowrap',
                      row.amountPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400',
                    )}
                  >
                    {row.amount}
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
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                      <MoreVertical className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      {/* Pagination */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {p.from} - {p.to}
          </span>{' '}
          of <span className="font-semibold text-slate-700 dark:text-slate-200">{p.total}</span>{' '}
          transactions
        </p>
        <div className="flex items-center gap-1">
          <PageButton>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
          <PageButton active>1</PageButton>
          {[2, 3, 4, 5].map((n) => (
            <PageButton key={n} className="hidden sm:flex">
              {n}
            </PageButton>
          ))}
          <PageButton>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
        </div>
      </div>
    </section>
  );
}

function PageButton({
  children,
  active = false,
  className = '',
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors',
        active
          ? 'bg-[#1a6cf0] text-white font-semibold shadow-xs'
          : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
        className,
      )}
    >
      {children}
    </button>
  );
}