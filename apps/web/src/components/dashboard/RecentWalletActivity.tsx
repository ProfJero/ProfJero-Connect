// apps/web/src/components/dashboard/RecentWalletActivity.tsx (new)
import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { DashboardResponse } from '@profjero/shared';

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  reserve: { bg: 'bg-amber-50', text: 'text-amber-700' },
  confirm: { bg: 'bg-rose-50', text: 'text-rose-700' },
  release: { bg: 'bg-purple-50', text: 'text-purple-700' },
  purchase: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  refund: { bg: 'bg-purple-50', text: 'text-purple-700' },
  manual_credit: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  manual_debit: { bg: 'bg-rose-50', text: 'text-rose-700' },
  reversal: { bg: 'bg-blue-50', text: 'text-blue-700' },
  adjustment: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

function formatSigned(n: number): string {
  const abs = Math.abs(n).toLocaleString();
  return n >= 0 ? `+${abs}` : `-${abs}`;
}

interface Props {
  transactions: DashboardResponse['recentTransactions'];
}

export function RecentWalletActivity({ transactions }: Props) {
  return (
    <Card className="overflow-hidden" data-purpose="recent-wallet-activity">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Recent Wallet Activity</h3>
        <ViewAllLink label="View all" href="/wallets" />
      </div>

      <TableScroll>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200/70">
            <tr>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-3">Project</th>
              <th className="py-2.5 px-3 text-center">Type</th>
              <th className="py-2.5 px-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500 text-sm">
                  No wallet activity yet.
                </td>
              </tr>
            )}
            {transactions.map((t) => {
              const { date, time } = splitDateTime(t.createdAt);
              const short = `${date.split(',')[0]} ${time}`;
              const style =
                TYPE_STYLES[t.type] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
              return (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                    {short}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 truncate">
                    {t.projectName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-semibold',
                        style.bg,
                        style.text,
                      )}
                    >
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-3 text-right font-bold',
                      t.availableDelta >= 0 ? 'text-emerald-700' : 'text-rose-600',
                    )}
                  >
                    {formatDelta(t.availableDelta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}

function formatDelta(n: number): string {
  if (n === 0) return '—';
  return formatSigned(n);
}