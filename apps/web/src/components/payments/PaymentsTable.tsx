import { useNavigate } from 'react-router-dom';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { Payment, PaymentStatus } from '@profjero/shared';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  abandoned: 'bg-slate-100 text-slate-600 border-slate-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  success: 'Successful',
  pending: 'Pending',
  failed: 'Failed',
  abandoned: 'Abandoned',
  refunded: 'Refunded',
};

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-sky-600',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-indigo-600',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatGhs(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortRef(ref: string): string {
  return ref.length > 20 ? `${ref.slice(0, 10)}…${ref.slice(-6)}` : ref;
}

interface Props {
  payments: Payment[];
  projectNames: Map<string, string>;
  selectedReference: string | null;
  onSelect: (reference: string) => void;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function PaymentsTable({
  payments,
  projectNames,
  selectedReference,
  onSelect,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: Props) {
  const navigate = useNavigate();
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + payments.length;

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-xl overflow-hidden flex flex-col"
      data-purpose="payments-table"
    >
      <TableScroll>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-3 w-8 text-center">#</th>
              <th className="py-3 px-3 whitespace-nowrap">Reference</th>
              <th className="py-3 px-3 whitespace-nowrap">Date</th>
              <th className="py-3 px-3 whitespace-nowrap">Project</th>
              <th className="py-3 px-3 whitespace-nowrap">Customer</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">Units</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">Amount</th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Credited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                  {total === 0 ? 'No payments yet.' : 'No payments match your filters.'}
                </td>
              </tr>
            )}
            {payments.map((p, idx) => {
              const { date, time } = splitDateTime(p.createdAt);
              const isSelected = p.reference === selectedReference;
              const projectName = projectNames.get(p.projectId) ?? '—';
              const rowNumber = (page - 1) * pageSize + idx + 1;

              return (
                <tr
                  key={p.reference}
                  onClick={() => onSelect(p.reference)}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70',
                  )}
                >
                  <td className="py-3 px-3 text-center text-slate-500 font-medium">
                    {rowNumber}
                  </td>
                  <td
                    className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap"
                    title={p.reference}
                  >
                    {shortRef(p.reference)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{date}</div>
                    <div className="text-[11px] text-slate-400">{time}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${p.projectId}`);
                      }}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center',
                          avatarColor(p.projectId),
                        )}
                      >
                        {projectName.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-slate-800">
                        {projectName}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap max-w-[180px] truncate">
                    {p.customerEmail ?? '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                    {p.units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatGhs(p.amountPesewas)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        STATUS_STYLES[p.status],
                      )}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {p.walletCreditedAt ? (
                      <span className="text-emerald-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          {total === 0 ? (
            'No payments'
          ) : (
            <>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{total}</span>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-[11px] text-slate-500 font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}