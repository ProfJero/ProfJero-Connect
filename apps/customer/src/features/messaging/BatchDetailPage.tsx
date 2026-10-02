import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { TableScroll } from '../../components/ui/TableScroll';
import { Badge } from '../../components/ui/Badge';
import { ErrorState, SkeletonRows, Spinner } from '../../components/ui/States';
import { btnSecondary, cardClass } from '../../components/ui/buttons';
import { useApi } from '../../lib/useApi';
import { BATCH_STATUS, RECORD_STATUS } from '../../lib/statusLabels';
import { formatDateTime, formatPhone } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { BatchWithRecords, RecordStatus } from '../../lib/types';

/** One send: message, totals, and every recipient's status. */
export function BatchDetailPage() {
  const { batchId = '' } = useParams();
  const { data, loading, error, refresh } = useApi<BatchWithRecords>(
    `/customer/sms/batches/${encodeURIComponent(batchId)}`,
  );
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');

  const counts = useMemo(() => {
    const m = new Map<RecordStatus, number>();
    for (const r of data?.records ?? []) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return m;
  }, [data]);
  const records = (data?.records ?? []).filter((r) => filter === 'all' || r.status === filter);

  const exportCsv = () => {
    if (!data) return;
    const lines = [
      'recipient,status,units_charged,units_returned,detail,updated_at',
      ...data.records.map((r) =>
        [
          `+${r.recipient}`,
          RECORD_STATUS[r.status].label,
          r.unitsCharged,
          r.unitsReleased,
          `"${(r.error ?? '').replace(/"/g, '""')}"`,
          r.updatedAt,
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${data.batch.createdAt.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link
            to="/messaging/history"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[#1a6cf0] dark:text-blue-400"
            aria-label="Back to message history"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Message details</h1>
        </div>
        {data && (
          <div className="flex gap-2">
            <button type="button" onClick={refresh} className={btnSecondary} disabled={loading}>
              {loading ? <Spinner /> : <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />}
              Refresh
            </button>
            <button type="button" onClick={exportCsv} className={btnSecondary}>
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className={cardClass}>
          <SkeletonRows rows={8} />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} className="m-0" />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className={cn(cardClass, 'lg:col-span-7 p-5')}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  From <span className="font-bold text-slate-800 dark:text-slate-100">{data.batch.senderId}</span> ·{' '}
                  {formatDateTime(data.batch.createdAt)} · {data.batch.source === 'api' ? 'via API' : 'from dashboard'}
                </div>
                <Badge tone={BATCH_STATUS[data.batch.status].tone} label={BATCH_STATUS[data.batch.status].label} />
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3.5">
                {data.batch.message}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {data.batch.messageSegments ?? 1} page{(data.batch.messageSegments ?? 1) === 1 ? '' : 's'} ·{' '}
                {data.batch.messageEncoding === 'UCS-2' ? 'Unicode' : 'Standard'} characters · Ref {data.batch.id}
              </p>
            </section>

            <section className={cn(cardClass, 'lg:col-span-5 p-5 grid grid-cols-2 gap-4 content-start')}>
              <Stat label="Recipients" value={data.batch.totalRecipients} />
              <Stat label="Accepted" value={data.batch.submittedCount} tone="text-blue-600 dark:text-blue-400" />
              <Stat label="Delivery confirmed" value={data.batch.deliveredCount} tone="text-emerald-600 dark:text-emerald-400" />
              <Stat label="Failed" value={data.batch.failedCount} tone="text-rose-600 dark:text-rose-400" />
              <Stat label="Units charged" value={data.batch.totalUnitsCharged} />
              <Stat label="Units returned" value={data.batch.totalUnitsReleased} />
              {data.batch.unknownCount > 0 && (
                <p className="col-span-2 text-[11px] text-amber-700 dark:text-amber-400">
                  {data.batch.unknownCount} message{data.batch.unknownCount === 1 ? ' is' : 's are'} awaiting confirmation from
                  the network. Their units stay reserved until it resolves — if they turn out not to have been sent, the
                  units come back automatically.
                </p>
              )}
            </section>
          </div>

          <section className={cn(cardClass, 'overflow-hidden')}>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mr-2">Recipients</h2>
              {(['all', ...counts.keys()] as Array<RecordStatus | 'all'>).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                    filter === s
                      ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                  )}
                >
                  {s === 'all' ? 'All' : RECORD_STATUS[s].label}{' '}
                  <span className="opacity-70 font-normal">{s === 'all' ? data.records.length : counts.get(s)}</span>
                </button>
              ))}
            </div>
            <TableScroll>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5 whitespace-nowrap">Recipient</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Units</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[220px]">Detail</th>
                    <th className="py-3 px-4 whitespace-nowrap">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                  {records.map((r) => {
                    const s = RECORD_STATUS[r.status];
                    return (
                      <tr key={r.id}>
                        <td className="py-3 px-5 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {formatPhone(r.recipient)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span title={s.hint}>
                            <Badge tone={s.tone} label={s.label} />
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {r.unitsCharged > 0 ? r.unitsCharged : r.unitsReleased > 0 ? `${r.unitsReleased} returned` : '—'}
                        </td>
                        <td className="py-3 px-4">{r.error ?? s.hint}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(r.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>
          </section>
        </>
      ) : null}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn('text-lg font-extrabold text-slate-900 dark:text-slate-100', tone)}>{value.toLocaleString()}</div>
    </div>
  );
}
