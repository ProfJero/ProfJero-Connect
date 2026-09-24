import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { splitDateTime } from '../../lib/datetime';
import { cn } from '../../lib/utils';
import type { ProviderRequest, ProviderRequestOperation } from '@profjero/shared';

const OPERATION_LABELS: Record<ProviderRequestOperation, string> = {
  send_sms: 'Send SMS',
  batch_reports: 'Batch Reports',
  message_report: 'Message Report',
  balance_check: 'Balance Check',
};

interface Props {
  requests: ProviderRequest[];
  loading: boolean;
  onRefresh: () => void;
}

export function ProviderRequestsTable({
  requests,
  loading,
  onRefresh,
}: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Request Log
            <span className="ml-2 text-slate-400 font-normal text-xs">
              {requests.length}
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Every API call this system has made to the provider.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[11px] font-semibold text-[#1976d2] hover:text-blue-700 shrink-0"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-8 space-y-3">
          <div className="h-8 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-3">Operation</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Duration</th>
                <th className="py-3 px-3">Summary</th>
                <th className="py-3 px-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    No requests logged yet.
                  </td>
                </tr>
              )}
              {requests.map((r) => {
                const { date, time } = splitDateTime(r.createdAt);
                const isError = r.status === 'error';
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      <div className="text-[11px]">{date}</div>
                      <div className="text-[10px] text-slate-400">{time}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      {OPERATION_LABELS[r.operation]}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          isError
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}
                      >
                        {isError ? (
                          <XCircle className="w-2.5 h-2.5" strokeWidth={2.5} />
                        ) : (
                          <CheckCircle2
                            className="w-2.5 h-2.5"
                            strokeWidth={2.5}
                          />
                        )}
                        {r.status}
                        {r.httpStatus !== null && ` ${r.httpStatus}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {r.durationMs}ms
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {r.summary || '—'}
                    </td>
                    <td className="py-3 px-3 text-rose-600 text-[11px] max-w-xs truncate">
                      {r.error ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Card>
  );
}