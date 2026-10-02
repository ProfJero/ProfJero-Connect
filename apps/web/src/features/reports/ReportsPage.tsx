import { useMemo, useState } from 'react';
import {
  Calendar,
  MessageSquare,
  Package,
  DollarSign,
  X,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { KpiCard, type KpiCardData } from '../../components/reports/KpiCard';
import {
  SmsAnalyticsCard,
  type SmsAnalyticsSummary,
} from '../../components/reports/SmsAnalyticsCard';
import { ProjectPerformanceTable } from '../../components/reports/ProjectPerformanceTable';
import { SmsVolumeTrendChart } from '../../components/reports/SmsVolumeTrendChart';
import { UnitConsumptionDonut } from '../../components/reports/UnitConsumptionDonut';
import { RevenueCostChart } from '../../components/reports/RevenueCostChart';
import {
  FinancialAnalytics,
  type FinancialCard,
} from '../../components/reports/FinancialAnalytics';
import { UsageTrendsChart } from '../../components/reports/UsageTrendsChart';
import { ProviderActivityCard } from '../../components/reports/ProviderActivityCard';
import { ReportsFooterBanners } from '../../components/reports/ReportsFooterBanners';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import {
  computeDonutSegments,
  computeProjectStats,
  filterByPeriod,
  filterPaymentsByPeriod,
  formatGhs,
  groupByDay,
  groupByWeek,
} from '../../lib/reportAggregation';
import type {
  PaymentListResponse,
  ProjectListResponse,
  ProviderListResponse,
  ProviderRequestListResponse,
  SmsBatchListResponse,
} from '@profjero/shared';

type PeriodKey = '24h' | '7d' | '30d' | '90d' | '180d' | '365d';

const PERIODS: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: '24h', label: 'Today', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '3M', days: 90 },
  { key: '180d', label: '6M', days: 180 },
  { key: '365d', label: '12M', days: 365 },
];

function formatRangeLabel(days: number): string {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function dailyLabels(days: number): string {
  if (days === 1) return 'today';
  return `last ${days} days`;
}

export function ReportsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  // "Now" for the summary windows, fixed when the page opens (render must be pure).
  const [now] = useState(() => Date.now());
  const periodDays = PERIODS.find((p) => p.key === period)?.days ?? 30;

  const batchesApi = useApi<SmsBatchListResponse>(
    '/admin/sms/batches?limit=200',
  );
  const paymentsApi = useApi<PaymentListResponse>('/admin/payments');
  const projectsApi = useApi<ProjectListResponse>('/admin/projects');
  const providersApi = useApi<ProviderListResponse>('/admin/providers');

  // The primary SMS provider — first active SMS provider in the list.
  const primaryProvider = useMemo(() => {
    const all = providersApi.data?.providers ?? [];
    return (
      all.find((p) => p.service === 'sms' && p.status === 'active') ??
      all.find((p) => p.service === 'sms') ??
      null
    );
  }, [providersApi.data]);

  const providerRequestsApi = useApi<ProviderRequestListResponse>(
    primaryProvider
      ? `/admin/providers/${primaryProvider.id}/requests?limit=5`
      : null,
  );

  const projectNames = useMemo(() => {
    const projects = projectsApi.data?.projects ?? [];
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projectsApi.data]);

  const allBatches = useMemo(() => batchesApi.data?.batches ?? [], [batchesApi.data?.batches]);
  const allPayments = useMemo(() => paymentsApi.data?.payments ?? [], [paymentsApi.data?.payments]);

  const filteredBatches = useMemo(
    () => filterByPeriod(allBatches, periodDays),
    [allBatches, periodDays],
  );
  const filteredPayments = useMemo(
    () => filterPaymentsByPeriod(allPayments, periodDays),
    [allPayments, periodDays],
  );

  // Derived
  const daily = useMemo(
    () => groupByDay(filteredBatches, periodDays),
    [filteredBatches, periodDays],
  );

  const weekly = useMemo(
    () =>
      groupByWeek(
        filteredBatches,
        filteredPayments,
        Math.min(12, Math.ceil(periodDays / 7)),
      ),
    [filteredBatches, filteredPayments, periodDays],
  );

  const projectStats = useMemo(
    () => computeProjectStats(filteredBatches, filteredPayments, projectNames),
    [filteredBatches, filteredPayments, projectNames],
  );

  const { segments, totalUnits: totalUnitsUsed } = useMemo(
    () => computeDonutSegments(projectStats),
    [projectStats],
  );

  // Totals
  const totalSms = filteredBatches.reduce(
    (sum, b) => sum + b.totalRecipients,
    0,
  );
  const totalUnitsConsumed = filteredBatches.reduce(
    (sum, b) => sum + b.totalUnitsCharged,
    0,
  );
  const totalFailed = filteredBatches.reduce(
    (sum, b) => sum + b.failedCount,
    0,
  );
  const successfulPayments = filteredPayments.filter(
    (p) => p.status === 'success',
  );
  const totalRevenuePesewas = successfulPayments.reduce(
    (sum, p) => sum + p.amountPesewas,
    0,
  );
  const totalUnitsSold = successfulPayments.reduce(
    (sum, p) => sum + p.units,
    0,
  );

  // Margin
  const revenueGhs = totalRevenuePesewas / 100;
  const providerCostPerUnit = primaryProvider?.costPerUnitGhs ?? null;
  const costGhs =
    providerCostPerUnit !== null
      ? totalUnitsConsumed * providerCostPerUnit
      : null;
  const grossMargin =
    revenueGhs > 0 && costGhs !== null
      ? (revenueGhs - costGhs) / revenueGhs
      : null;

  // Summary
  const dayMs = 24 * 60 * 60 * 1000;
  const dailySms = filteredBatches
    .filter((b) => new Date(b.createdAt).getTime() >= now - dayMs)
    .reduce((sum, b) => sum + b.totalRecipients, 0);
  const weeklySms = filteredBatches
    .filter((b) => new Date(b.createdAt).getTime() >= now - 7 * dayMs)
    .reduce((sum, b) => sum + b.totalRecipients, 0);
  const monthlySms = filteredBatches
    .filter((b) => new Date(b.createdAt).getTime() >= now - 30 * dayMs)
    .reduce((sum, b) => sum + b.totalRecipients, 0);

  const totalOutcomes = filteredBatches.reduce(
    (sum, b) => sum + b.submittedCount + b.failedCount + b.unknownCount,
    0,
  );
  const totalSubmitted = filteredBatches.reduce(
    (sum, b) => sum + b.submittedCount,
    0,
  );
  const successRate = totalOutcomes > 0 ? totalSubmitted / totalOutcomes : 0;
  const failureRate = totalOutcomes > 0 ? totalFailed / totalOutcomes : 0;

  const summary: SmsAnalyticsSummary = {
    dailySms,
    weeklySms,
    monthlySms,
    unitsConsumed: totalUnitsConsumed,
    successRate,
    failureRate,
  };

  // KPI cards
  const kpiCards: KpiCardData[] = [
    {
      label: 'Total SMS Sent',
      value: totalSms.toLocaleString(),
      footnote: `across ${filteredBatches.length} batch${filteredBatches.length === 1 ? '' : 'es'}`,
      icon: MessageSquare,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Units Consumed',
      value: totalUnitsConsumed.toLocaleString(),
      footnote: 'from SMS sends',
      icon: Package,
      iconBg: 'bg-emerald-700',
    },
    {
      label: 'Revenue',
      value: formatGhs(totalRevenuePesewas),
      footnote: `${successfulPayments.length} successful payment${successfulPayments.length === 1 ? '' : 's'}`,
      icon: DollarSign,
      iconBg: 'bg-indigo-600',
    },
    {
      label: 'Failed SMS',
      value: totalFailed.toLocaleString(),
      footnote:
        totalSms > 0
          ? `${((totalFailed / totalSms) * 100).toFixed(1)}% of total`
          : 'no data',
      icon: X,
      iconBg: 'bg-red-500',
    },
    {
      label: 'Gross Margin',
      value:
        grossMargin !== null
          ? `${(grossMargin * 100).toFixed(1)}%`
          : costGhs === null
            ? '—'
            : 'no revenue',
      footnote:
        costGhs === null
          ? 'Set provider cost per unit'
          : grossMargin !== null
            ? `cost ${formatGhs(costGhs * 100)}`
            : 'no revenue in period',
      icon: TrendingUp,
      iconBg: 'bg-amber-500',
    },
  ];

  // Financial cards
  const avgPurchase =
    successfulPayments.length > 0
      ? totalRevenuePesewas / successfulPayments.length
      : 0;
  const pendingPayments = filteredPayments.filter(
    (p) => p.status === 'pending',
  ).length;
  const failedPayments = filteredPayments.filter(
    (p) => p.status === 'failed',
  ).length;

  const financialCards: FinancialCard[] = [
    {
      label: 'Revenue',
      shortLabel: 'R',
      shortBg: 'bg-blue-100 text-blue-600',
      value: formatGhs(totalRevenuePesewas),
    },
    {
      label: 'Provider Cost',
      shortLabel: 'C',
      shortBg: 'bg-amber-100 text-amber-700',
      value: costGhs !== null ? formatGhs(costGhs * 100) : '—',
    },
    {
      label: 'Avg. Purchase',
      shortLabel: 'A',
      shortBg: 'bg-violet-100 text-violet-600',
      value: formatGhs(avgPurchase),
    },
    {
      label: 'Units Sold',
      shortLabel: 'U',
      shortBg: 'bg-emerald-100 text-emerald-700',
      value: totalUnitsSold.toLocaleString(),
    },
    {
      label: 'Pending',
      shortLabel: 'W',
      shortBg: 'bg-amber-100 text-amber-700',
      value: String(pendingPayments),
    },
    {
      label: 'Failed',
      shortLabel: 'F',
      shortBg: 'bg-rose-100 text-rose-600',
      value: String(failedPayments),
    },
  ];

  // Render
  const loading =
    batchesApi.loading ||
    paymentsApi.loading ||
    projectsApi.loading ||
    providersApi.loading;
  const error =
    batchesApi.error ||
    paymentsApi.error ||
    projectsApi.error ||
    providersApi.error;
  const reload = () => {
    batchesApi.reload();
    paymentsApi.reload();
    projectsApi.reload();
    providersApi.reload();
    providerRequestsApi.reload();
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <h1 className="sr-only">Reports</h1>
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load reports.</div>
            <div className="mt-0.5 opacity-80">{error.message}</div>
          </div>
          <button
            onClick={reload}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-500" strokeWidth={2} />
            <span>{formatRangeLabel(periodDays)}</span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'px-2.5 py-1 rounded transition',
                  period === p.key
                    ? 'bg-[#1976d2] text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading && !batchesApi.data
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse"
              />
            ))
          : kpiCards.map((c) => <KpiCard key={c.label} card={c} />)}
      </section>

      {/* Row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SmsAnalyticsCard
          daily={daily}
          summary={summary}
          periodLabel={dailyLabels(periodDays)}
        />
        <ProjectPerformanceTable stats={projectStats} />
      </section>

      {/* Row 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <SmsVolumeTrendChart weeks={weekly} />
        <UnitConsumptionDonut segments={segments} totalUnits={totalUnitsUsed} />
        <RevenueCostChart weeks={weekly} />
      </section>

      {/* Row 3 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <FinancialAnalytics cards={financialCards} />
        <UsageTrendsChart daily={daily} />
        <ProviderActivityCard
          requests={providerRequestsApi.data?.requests ?? []}
          providerId={primaryProvider?.id ?? null}
          providerLabel={primaryProvider?.label ?? null}
        />
      </section>

      <ReportsFooterBanners />
    </main>
  );
}