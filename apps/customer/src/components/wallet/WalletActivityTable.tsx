import {
  FileText,
  Search,
  MoreVertical,
  MessageSquare,
  Smartphone,
  Plus,
  MessageCircle,
  ArrowUp,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import {
  walletActivity,
  walletPagination,
  activityTypeOptions,
  type WalletActivityType,
} from '../../mock/wallet';
import { cn } from '../../lib/utils';

const TYPE_ICON: Record<WalletActivityType, { icon: LucideIcon; bg: string }> = {
  'SMS Purchase': { icon: MessageSquare, bg: 'bg-blue-500' },
  'Data Purchase': { icon: Smartphone, bg: 'bg-cyan-500' },
  'Wallet Top-up': { icon: Plus, bg: 'bg-emerald-500' },
  'SMS Usage': { icon: MessageCircle, bg: 'bg-purple-500' },
  Refund: { icon: ArrowUp, bg: 'bg-amber-500' },
  Adjustment: { icon: SettingsIcon, bg: 'bg-slate-500' },
};

export function WalletActivityTable() {
  const p = walletPagination;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header + toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" strokeWidth={2} />
            </span>
            <input
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0]"
              placeholder="Search transactions..."
              type="text"
            />
          </div>

          <select
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none cursor-pointer"
            defaultValue={activityTypeOptions[0]}
          >
            {activityTypeOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <TableScroll>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/50">
              <th className="py-3 px-5 w-12 text-slate-400 dark:text-slate-500">#</th>
              <th className="py-3 px-5 whitespace-nowrap">Description</th>
              <th className="py-3 px-5 whitespace-nowrap">Date &amp; Time</th>
              <th className="py-3 px-5 whitespace-nowrap">Amount</th>
              <th className="py-3 px-5 whitespace-nowrap">Balance After</th>
              <th className="py-3 px-5 whitespace-nowrap">Status</th>
              <th className="py-3 px-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {walletActivity.map((row) => {
              const { icon: Icon, bg } = TYPE_ICON[row.type];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-5 text-slate-400 dark:text-slate-500 font-medium">
                    {row.id}
                  </td>
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
                          {row.type}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {row.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {row.date}
                  </td>
                  <td
                    className={cn(
                      'py-4 px-5 font-bold whitespace-nowrap',
                      row.amountPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400',
                    )}
                  >
                    {row.amount}
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.balanceAfter}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      • {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-medium text-slate-700 dark:text-slate-200">{p.from} - {p.to}</span> of{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.total}</span> transactions
        </div>
        <div className="flex items-center gap-1 font-medium">
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
        'w-7 h-7 rounded flex items-center justify-center text-xs transition-colors',
        active
          ? 'bg-[#1a6cf0] text-white font-bold'
          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
        className,
      )}
    >
      {children}
    </button>
  );
}