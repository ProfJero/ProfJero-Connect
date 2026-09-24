import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { SmsBatchListItem, SmsBatchStatus } from '@profjero/shared';

const STATUS_STYLES: Record<SmsBatchStatus, string> = {
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  submitting: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS: Record<SmsBatchStatus, string> = {
  queued: 'Queued',
  submitting: 'Submitting',
  submitted: 'Submitted',
  partial: 'Partial',
  completed: 'Completed',
  failed: 'Failed',
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

function shortId(id: string): string {
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

interface Props {
  batches: SmsBatchListItem[];
  total: number;
  selectedBatchId: string | null;
  onSelect: (batchId: string) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function SmsLogsTable({
  batches,
  total,
  selectedBatchId,
  onSelect,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: Props) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + batches.length;

  return (
    <div
      className="flex-1 w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-w-0"
      data-purpose="sms-logs-table-container"
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
          SMS Batches{' '}
          <span className="text-slate-400 font-medium lowercase">({total})</span>
        </h3>
      </div>

      <TableScroll>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-3 w-8 text-center">#</th>
              <th className="py-3 px-3 whitespace-nowrap">Date &amp; Time</th>
              <th className="py-3 px-3 whitespace-nowrap">Project</th>
              <th className="py-3 px-3 whitespace-nowrap">Sender ID</th>
              <th className="py-3 px-3 whitespace-nowrap min-w-[180px]">
                Message
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                Recipients
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                Results
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                Units
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 whitespace-nowrap">Batch ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {batches.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                  {total === 0
                    ? 'No SMS batches yet.'
                    : 'No batches match your filters.'}
                </td>
              </tr>
            )}
            {batches.map((b, idx) => {
              const { date, time } = splitDateTime(b.createdAt);
              const isSelected = b.id === selectedBatchId;
              const rowNumber = (page - 1) * pageSize + idx + 1;
              return (
                <tr
                  key={b.id}
                  onClick={() => onSelect(b.id)}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50',
                  )}
                >
                  <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                    {rowNumber}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{date}</div>
                    <div className="text-[11px] text-slate-400">{time}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center',
                          avatarColor(b.projectId),
                        )}
                      >
                        {b.projectName.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium">{b.projectName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-medium whitespace-nowrap text-slate-600">
                    {b.senderId ?? '—'}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                    {b.message}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                    {b.totalRecipients}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-[11px]">
                      {b.submittedCount > 0 && (
                        <span className="text-emerald-600 font-semibold">
                          {b.submittedCount}✓
                        </span>
                      )}
                      {b.failedCount > 0 && (
                        <span className="text-rose-600 font-semibold">
                          {b.failedCount}✗
                        </span>
                      )}
                      {b.unknownCount > 0 && (
                        <span className="text-amber-600 font-semibold">
                          {b.unknownCount}?
                        </span>
                      )}
                      {b.submittedCount + b.failedCount + b.unknownCount === 0 && (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                    {b.totalUnitsCharged}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        STATUS_STYLES[b.status],
                      )}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td
                    className="py-3.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap"
                    title={b.id}
                  >
                    {shortId(b.id)}
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
            'No batches'
          ) : (
            <>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{total}</span>{' '}
              batches
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <span className="text-[11px] text-slate-500 font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}