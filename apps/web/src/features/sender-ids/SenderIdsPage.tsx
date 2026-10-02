import { useMemo, useState } from 'react';
import { BadgeCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { PendingQueueSection } from '../../components/sender-ids/PendingQueueSection';
import { SenderIdRegistryTable } from '../../components/sender-ids/SenderIdRegistryTable';
import { useApi } from '../../lib/useApi';
import type {
  PendingQueue,
  SenderIdListResponse,
  SenderIdValueStatus,
} from '@profjero/shared';

export function SenderIdsPage() {
  const listApi = useApi<SenderIdListResponse>('/admin/sender-ids');
  const queueApi = useApi<PendingQueue>('/admin/sender-ids/queue');

  const [filter, setFilter] = useState<SenderIdValueStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const all = useMemo(() => listApi.data?.senderIds ?? [], [listApi.data?.senderIds]);
  const queue = queueApi.data;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (!needle) return true;
      return (
        s.value.toLowerCase().includes(needle) ||
        s.assignments.some((a) =>
          a.projectName.toLowerCase().includes(needle),
        )
      );
    });
  }, [all, filter, search]);

  const refresh = async () => {
    setRefreshing(true);
    listApi.reload();
    queueApi.reload();
    // Brief delay so the spinner is visible without feeling laggy.
    setTimeout(() => setRefreshing(false), 400);
  };

  const error = listApi.error || queueApi.error;
  const loading = listApi.loading || queueApi.loading;

  const totalPending = queue?.total ?? 0;

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <BadgeCheck className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sender IDs
            </h2>
            <p className="text-xs text-slate-500">
              Review requests and manage which projects can send as which
              identities.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load Sender IDs.</div>
            <div className="mt-0.5 opacity-80">{error.message}</div>
          </div>
          <button
            onClick={refresh}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending queue — only when there's something to review */}
      {!loading && queue && totalPending > 0 && (
        <PendingQueueSection
          queue={queue}
          onChanged={() => {
            listApi.reload();
            queueApi.reload();
          }}
        />
      )}

      {/* Registry */}
      <SenderIdRegistryTable
        senderIds={filtered}
        total={all.length}
        loading={loading && !listApi.data}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        onChanged={() => {
          listApi.reload();
          queueApi.reload();
        }}
      />
    </main>
  );
}