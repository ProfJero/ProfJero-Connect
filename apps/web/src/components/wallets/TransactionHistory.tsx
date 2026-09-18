import { Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { transactionRows, transactionPagination, type TxType } from '../../mock/wallets';
import { cn } from '../../lib/utils';

const TX_STYLES: Record<TxType, { bg: string; text: string; dot: string }> = {
  Purchase: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Deduct: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
  Refund: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
  Adjust: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
};

function TxBadge({ type }: { type: TxType }) {
  const s = TX_STYLES[type];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        s.bg,
        s.text,
        type === 'Purchase' && 'border-emerald-200/50',
        type === 'Deduct' && 'border-rose-200/50',
        type === 'Refund' && 'border-purple-200/50',
        type === 'Adjust' && 'border-amber-200/50',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1', s.dot)} />
      {type}
    </span>
  );
}

export function TransactionHistory() {
  const p = transactionPagination;

  return (
    <Card className="flex flex-col" data-purpose="unit-transaction-history-card">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Unit Transaction History</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 py-1 px-2.5 rounded-lg text-xs hover:bg-slate-50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
            <span>Sep 15, 2025 - Sep 21, 2025</span>
          </button>

          <select className="py-1 px-2 text-xs border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none">
            <option>All Projects</option>
            <option>GABS</option>
            <option>DBI</option>
            <option>Church A</option>
            <option>Pharmacy</option>
            <option>School</option>
          </select>

          <select className="py-1 px-2 text-xs border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none">
            <option>All Types</option>
            <option>Purchase</option>
            <option>Deduct</option>
            <option>Refund</option>
            <option>Adjust</option>
          </select>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg text-xs flex items-center gap-1 transition shadow-xs">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-3 font-semibold text-center">Type</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units</th>
              <th className="py-2.5 px-3 font-semibold text-right">Previous Balance</th>
              <th className="py-2.5 px-3 font-semibold text-right">New Balance</th>
              <th className="py-2.5 px-3 font-semibold">Reference</th>
              <th className="py-2.5 px-3 font-semibold">Reason</th>
              <th className="py-2.5 px-3 font-semibold">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactionRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 text-slate-400">{row.id}</td>
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{row.dateTime}</td>
                <td className="py-2.5 px-3 font-semibold text-blue-600">{row.project}</td>
                <td className="py-2.5 px-3 text-center">
                  <TxBadge type={row.type} />
                </td>
                <td
                  className={cn(
                    'py-2.5 px-3 text-right font-bold',
                    row.unitsPositive ? 'text-emerald-600' : 'text-rose-600',
                  )}
                >
                  {row.units}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-500">{row.previousBalance}</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800">{row.newBalance}</td>
                <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{row.reference}</td>
                <td className="py-2.5 px-3 text-slate-600">{row.reason}</td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">{row.performedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-medium text-slate-700">{p.showingFrom}</span> to{' '}
          <span className="font-medium text-slate-700">{p.showingTo}</span> of{' '}
          <span className="font-medium text-slate-700">{p.total}</span> transactions
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          {p.pages.map((n) => (
            <button
              key={n}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded text-xs',
                n === 1
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50',
              )}
            >
              {n}
            </button>
          ))}
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </Card>
  );
}