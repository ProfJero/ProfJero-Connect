import { Smartphone, CreditCard, Landmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { PaymentsFilterBar } from './PaymentsFilterBar';
import {
  paymentRows,
  paymentsPagination,
  type PaymentMethod,
} from '../../mock/payments';
import { cn } from '../../lib/utils';

const METHOD_ICON: Record<PaymentMethod, typeof Smartphone> = {
  'Mobile Money': Smartphone,
  Card: CreditCard,
  'Bank Transfer': Landmark,
};

export function PaymentsTable() {
  const p = paymentsPagination;

  return (
    <Card className="overflow-hidden" data-purpose="table-container">
      <PaymentsFilterBar />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-3 w-8 text-center">#</th>
              <th className="py-3 px-3">Payment Reference</th>
              <th className="py-3 px-3">Date &amp; Time</th>
              <th className="py-3 px-3">Project / Client</th>
              <th className="py-3 px-3">Package</th>
              <th className="py-3 px-3">Units Purchased</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Gateway</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Method</th>
              <th className="py-3 px-3">Txn Reference</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
            {paymentRows.map((row, idx) => {
              const isSelected = idx === 0;
              const MethodIcon = METHOD_ICON[row.method];
              const gatewayColor =
                row.gateway === 'Paystack' ? 'text-[#0ea5e9]' : 'text-slate-700';
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition cursor-pointer',
                    isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/70',
                  )}
                >
                  <td className="py-3 px-3 text-center text-slate-400 font-normal">{row.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{row.reference}</td>
                  <td className="py-3 px-3 text-slate-500">
                    <div>{row.date}</div>
                    <div className="text-[10px] text-slate-400">{row.time}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center',
                          row.projectAvatarBg,
                        )}
                      >
                        {row.project.charAt(0)}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 leading-tight">
                          {row.project}
                        </div>
                        <div className="text-[10px] text-slate-400">{row.projectClient}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{row.package}</td>
                  <td className="py-3 px-3 text-slate-600">{row.units}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{row.amount}</td>
                  <td className="py-3 px-3">
                    <div className={cn('flex items-center gap-1 font-medium text-xs', gatewayColor)}>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M3 6h18v3H3zm0 5h18v3H3zm0 5h18v3H3z" />
                      </svg>
                      {row.gateway}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MethodIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{row.method}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {row.txnReference}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 rounded transition">
                        View
                      </button>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Showing{' '}
          <span className="font-semibold text-slate-700">
            {p.from} to {p.to}
          </span>{' '}
          of <span className="font-semibold text-slate-700">{p.total}</span> payments
        </p>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {p.pages.map((n) => (
            <button
              key={n}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded text-xs',
                n === 1
                  ? 'bg-[#1976d2] text-white font-medium shadow-xs'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium',
              )}
            >
              {n}
            </button>
          ))}
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}