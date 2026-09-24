import { useMemo, useState } from 'react';
import { MessageSquare, Download } from 'lucide-react';
import { MetricCard, type Metric } from '../../components/sms-logs/MetricCard';
import {
  SmsLogsFilterBar,
  type SmsLogsFilterBarProps,
} from '../../components/sms-logs/SmsLogsFilterBar';
import { SmsLogsTable } from '../../components/sms-logs/SmsLogsTable';
import { SmsDetailsInspector } from '../../components/sms-logs/SmsDetailsInspector';
import { useApi } from '../../lib/useApi';
import type {
  SmsBatchListResponse,
  SmsBatchDetailResponse,
  SmsBatchStatus,
  ProjectListResponse,
} from '@profjero/shared';

const PAGE_SIZE = 15;

export function SmsLogsPage() {
  const batchesApi = useApi<SmsBatchListResponse>('/admin/sms/batches?limit=200');
  const projectsApi = useApi<ProjectListResponse>('/admin/projects');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SmsBatchStatus | 'all'>('all');
  const [projectId, setProjectId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const detailApi = useApi<SmsBatchDetailResponse>(
    selectedBatchId ? `/admin/sms/batches/${selectedBatchId}` : null,
  );

  const allBatches = batchesApi.data?.batches ?? [];
  const projects = projectsApi.data?.projects ?? [];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allBatches.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (projectId !== 'all' && b.projectId !== projectId) return false;
      if (!needle) return true;
      return (
        b.id.toLowerCase().includes(needle) ||
        b.message.toLowerCase().includes(needle)
      );
    });
  }, [allBatches, search, status, projectId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // KPIs reflect the full set, not the filtered slice.
  const totals = allBatches.reduce(
    (acc, b) => {
      acc.recipients += b.totalRecipients;
      acc.submitted += b.submittedCount;
      acc.failed += b.failedCount;
      acc.unknown += b.unknownCount;
      acc.units += b.totalUnitsCharged;
      return acc;
    },
    { recipients: 0, submitted: 0, failed: 0, unknown: 0, units: 0 },
  );

  const metrics: Metric[] = [
    {
      label: 'Total Messages',
      value: totals.recipients.toLocaleString(),
      footnote: `Across ${allBatches.length} batches`,
      icon: 'package',
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Successful Messages',
      value: totals.submitted.toLocaleString(),
      footnote:
        totals.recipients > 0
          ? `${((totals.submitted / totals.recipients) * 100).toFixed(1)}% success rate`
          : 'No data',
      icon: 'check',
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Failed Messages',
      value: totals.failed.toLocaleString(),
      footnote:
        totals.recipients > 0
          ? `${((totals.failed / totals.recipients) * 100).toFixed(1)}% failure rate`
          : 'No data',
      icon: 'x',
      iconBg: 'bg-red-500',
    },
    {
      label: 'Unknown Messages',
      value: totals.unknown.toLocaleString(),
      footnote: 'Awaiting reconciliation',
      icon: 'help',
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Units Consumed',
      value: totals.units.toLocaleString(),
      footnote: 'Confirmed SMS charges',
      icon: 'send',
      iconBg: 'bg-purple-600',
    },
  ];

  const hasFilters = search.length > 0 || status !== 'all' || projectId !== 'all';

  const filterBarProps: SmsLogsFilterBarProps = {
    search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
    status,
    onStatusChange: (v) => {
      setStatus(v);
      setPage(1);
    },
    projectId,
    onProjectChange: (v) => {
      setProjectId(v);
      setPage(1);
    },
    projects,
    onClear: () => {
      setSearch('');
      setStatus('all');
      setProjectId('all');
      setPage(1);
    },
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
            <MessageSquare className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">SMS Logs</h2>
            <p className="text-xs text-slate-500">
              View, track and manage all SMS sent through ProfJero SMS.
            </p>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all shrink-0"
          type="button"
          disabled
          title="Export not yet available"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>Export Logs</span>
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {batchesApi.loading && !batchesApi.data
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200/80 animate-pulse"
              />
            ))
          : metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
      </section>

      <SmsLogsFilterBar {...filterBarProps} />

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <SmsLogsTable
          batches={paginated}
          total={hasFilters ? filtered.length : allBatches.length}
          selectedBatchId={selectedBatchId}
          onSelect={setSelectedBatchId}
          page={safePage}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        <SmsDetailsInspector
          detail={detailApi.data}
          loading={detailApi.loading}
          error={detailApi.error}
          onClose={() => setSelectedBatchId(null)}
        />
      </div>
    </main>
  );
}