import { Link } from 'react-router-dom';
import { Server, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
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
  providerId: string | null;
  providerLabel: string | null;
}

export function ProviderActivityCard({
  requests,
  providerId,
  providerLabel,
}: Props) {
  return (
    <Card className="p-5 lg:col-span-4" data-purpose="provider-activity">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-700" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Provider Activity</h3>
        </div>
        {providerId && (
          <Link
            to={`/providers/${providerId}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        )}
      </div>

      {!providerLabel && (
        <div className="py-8 text-center text-xs text-slate-500">
          No provider configured.
        </div>
      )}

      {providerLabel && requests.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          No activity yet.
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-2.5">
          {requests.map((r, i) => {
            const { date, time } = splitDateTime(r.createdAt);
            const isError = r.status === 'error';
            return (
              <div
                key={r.id}
                className={cn(
                  'flex items-start gap-2.5 py-1.5 text-xs',
                  i < requests.length - 1 && 'border-b border-slate-100',
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    isError
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-700',
                  )}
                >
                  {isError ? (
                    <XCircle className="w-2.5 h-2.5" strokeWidth={2.5} />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700 truncate">
                      {OPERATION_LABELS[r.operation]}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {r.durationMs}ms
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {date} {time}
                    {r.error ? ` · ${r.error}` : ` · ${r.summary}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}