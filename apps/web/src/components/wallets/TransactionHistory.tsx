import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type {
  WalletTransactionType,
  WalletTransactionWithProject,
} from '@profjero/shared';

const TYPE_STYLES: Record<
  WalletTransactionType,
  { bg: string; text: string; dot: string; label: string }
> = {
  reserve: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Reserve' },
  confirm: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Confirm' },
  release: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Release' },
  purchase: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Purchase' },
  refund: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Refund' },
  manual_credit: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Credit' },
  manual_debit: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Debit' },
  reversal: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Reversal' },
  adjustment: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Adjustment' },
};

function TxBadge({ type }: { type: WalletTransactionType }) {
  const s = TYPE_STYLES[type];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200/50',
        s.bg,
        s.text,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1', s.dot)} />
      {s.label}
    </span>
  );
}

function formatSigned(n: number): string {
  const abs = Math.abs(n).toLocaleString();
  return n >= 0 ? `+${abs}` : `-${abs}`;
}

/** What we display in the "units" column: prefer available movement, else reserved. */
function displayDelta(t: WalletTransactionWithProject): number {
  return t.availableDelta !== 0 ? t.availableDelta : t.reservedDelta;
}

interface Props {
  transactions: WalletTransactionWithProject[];
  total: number;
}

export function TransactionHistory({ transactions, total }: Props) {
  return (
    <Card className="flex flex-col" data-purpose="unit-transaction-history-card">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">
          Unit Transaction History
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Most recent {transactions.length} of {total} ledger entries
        </p>
      </div>

      <TableScroll>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-3 font-semibold text-center">Type</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units</th>
              <th className="py-2.5 px-3 font-semibold text-right">Previous</th>
              <th className="py-2.5 px-3 font-semibold text-right">New</th>
              <th className="py-2.5 px-3 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                  No transactions yet.
                </td>
              </tr>
            )}
            {transactions.map((t, idx) => {
              const { date, time } = splitDateTime(t.createdAt);
              const delta = displayDelta(t);
              const previous = t.availableAfter - t.availableDelta;
              return (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                    <div>{date}</div>
                    <div className="text-slate-400 text-[10px]">{time}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600 whitespace-nowrap">
                    {t.projectName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <TxBadge type={t.type} />
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-3 text-right font-bold whitespace-nowrap',
                      delta >= 0 ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {formatSigned(delta)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {previous.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                    {t.availableAfter.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-[220px] truncate">
                    {t.description ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{transactions.length}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span> entries
      </div>
    </Card>
  );
}