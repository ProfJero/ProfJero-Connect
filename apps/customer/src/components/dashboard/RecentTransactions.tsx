import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Mail, Smartphone, Phone } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import { StatusBadge } from '../ui/StatusBadge';
import { recentTransactions, type TxType } from '../../mock/dashboard';
import { cn } from '../../lib/utils';

const TYPE_STYLE: Record<TxType, { icon: typeof Wallet; bg: string; color: string }> = {
  'Wallet Funding': { icon: Wallet, bg: 'bg-blue-100 dark:bg-blue-500/20', color: 'text-[#1a6cf0] dark:text-blue-400' },
  SMS: { icon: Mail, bg: 'bg-sky-100 dark:bg-sky-500/20', color: 'text-sky-600 dark:text-sky-400' },
  Data: { icon: Smartphone, bg: 'bg-emerald-100 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
  Airtime: { icon: Phone, bg: 'bg-amber-100 dark:bg-amber-500/20', color: 'text-amber-600 dark:text-amber-400' },
};

export function RecentTransactions() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Transactions</h3>
        <Link to="/transactions" className="text-[#1a6cf0] dark:text-blue-400 hover:underline text-xs font-medium flex items-center gap-1">
          <span>View all</span>
          <ArrowRight className="w-3 h-3" strokeWidth={2} />
        </Link>
      </div>

      <TableScroll>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="py-2.5 px-5 whitespace-nowrap">Date &amp; Time</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Description</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Amount</th>
              <th className="py-2.5 px-5 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((row, i) => {
              const style = TYPE_STYLE[row.type];
              const Icon = style.icon;
              return (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">{row.date}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', style.bg, style.color)}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.description}</td>
                  <td className={cn('py-3 px-4 font-semibold whitespace-nowrap', row.amountPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400')}>
                    {row.amount}
                  </td>
                  <td className="py-3 px-5">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}