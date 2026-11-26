import { useMemo, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { PaymentMetricCard, type PaymentMetric } from '../../components/payments/PaymentMetricCard';
import { PaymentsFilterBar } from '../../components/payments/PaymentsFilterBar';
import { PaymentsTable } from '../../components/payments/PaymentsTable';
import { PaymentDetailsInspector } from '../../components/payments/PaymentDetailsInspector';
import { InitiatePaymentModal } from '../../components/payments/InitiatePaymentModal';
import { useNewParam } from '../../lib/useNewParam';
import { PaymentUrlModal } from '../../components/payments/PaymentUrlModal';
import { useApi } from '../../lib/useApi';
import type {
  InitiatePaymentResponse,
  PaymentListResponse,
  PaymentStatus,
  ProjectListResponse,
} from '@profjero/shared';

const PAGE_SIZE = 15;

export function PaymentsPage() {
  const paymentsApi = useApi<PaymentListResponse>('/admin/payments');
  const projectsApi = useApi<ProjectListResponse>('/admin/projects');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  const [projectId, setProjectId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [newRequested, dismissNew] = useNewParam();
  const [urlResponse, setUrlResponse] =
    useState<InitiatePaymentResponse | null>(null);

  const projects = useMemo(() => projectsApi.data?.projects ?? [], [projectsApi.data?.projects]);
  const allPayments = useMemo(() => paymentsApi.data?.payments ?? [], [paymentsApi.data?.payments]);
  const projectNames = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allPayments.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (projectId !== 'all' && p.projectId !== projectId) return false;
      if (!needle) return true;
      return (
        p.reference.toLowerCase().includes(needle) ||
        (p.customerEmail ?? '').toLowerCase().includes(needle)
      );
    });
  }, [allPayments, search, status, projectId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // KPIs — global (not filter-scoped).
  const successful = allPayments.filter((p) => p.status === 'success');
  const totalCollected = successful.reduce((s, p) => s + p.amountPesewas, 0);
  const totalUnitsSold = successful.reduce((s, p) => s + p.units, 0);
  const pendingCount = allPayments.filter((p) => p.status === 'pending').length;
  const failedCount = allPayments.filter((p) => p.status === 'failed').length;
  const avgValue =
    successful.length > 0 ? totalCollected / successful.length : 0;

  const metrics: PaymentMetric[] = [
    {
      label: 'Total Collected',
      value: `GHS ${(totalCollected / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      footnote: `${successful.length} successful`,
      icon: CreditCard,
      iconBg: 'bg-[#1976d2]',
    },
    {
      label: 'Successful',
      value: String(successful.length),
      footnote: `of ${allPayments.length} total`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Pending',
      value: String(pendingCount),
      footnote: 'awaiting confirmation',
      icon: Clock,
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Failed',
      value: String(failedCount),
      footnote: 'needs attention',
      icon: XCircle,
      iconBg: 'bg-rose-500',
    },
    {
      label: 'Units Sold',
      value: totalUnitsSold.toLocaleString(),
      footnote: 'from successful payments',
      icon: Package,
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Avg. Value',
      value: `GHS ${(avgValue / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      footnote: 'per successful payment',
      icon: BarChart3,
      iconBg: 'bg-sky-600',
    },
  ];

  const selectedPayment = selectedRef
    ? allPayments.find((p) => p.reference === selectedRef) ?? null
    : null;

  const hasFilters =
    search.length > 0 || status !== 'all' || projectId !== 'all';

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <h1 className="sr-only">Payments</h1>
      {paymentsApi.error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load payments.</div>
            <div className="mt-0.5 opacity-80">{paymentsApi.error.message}</div>
          </div>
          <button
            onClick={() => paymentsApi.reload()}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {paymentsApi.loading && !paymentsApi.data
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200/80 animate-pulse"
              />
            ))
          : metrics.map((m) => <PaymentMetricCard key={m.label} metric={m} />)}
      </section>

      <section className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0 bg-white border border-slate-200/90 rounded-xl overflow-hidden flex flex-col">
          <PaymentsFilterBar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            projectId={projectId}
            onProjectChange={(v) => {
              setProjectId(v);
              setPage(1);
            }}
            projects={projects}
            onClear={() => {
              setSearch('');
              setStatus('all');
              setProjectId('all');
              setPage(1);
            }}
            onInitiate={() => setInitiateOpen(true)}
          />

          <PaymentsTable
            payments={paginated}
            projectNames={projectNames}
            selectedReference={selectedRef}
            onSelect={setSelectedRef}
            total={hasFilters ? filtered.length : allPayments.length}
            page={safePage}
            pageSize={PAGE_SIZE}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <PaymentDetailsInspector
          payment={selectedPayment}
          projectName={
            selectedPayment
              ? projectNames.get(selectedPayment.projectId) ?? '—'
              : ''
          }
          onClose={() => setSelectedRef(null)}
          onChanged={() => paymentsApi.reload()}
        />
      </section>

      <InitiatePaymentModal
        open={initiateOpen || newRequested}
        projects={projects}
        onClose={() => {
          setInitiateOpen(false);
          dismissNew();
        }}
        onInitiated={(resp) => {
          setInitiateOpen(false);
          dismissNew();
          setUrlResponse(resp);
          paymentsApi.reload();
        }}
      />

      <PaymentUrlModal
        open={urlResponse !== null}
        response={urlResponse}
        onClose={() => setUrlResponse(null)}
      />
    </main>
  );
}