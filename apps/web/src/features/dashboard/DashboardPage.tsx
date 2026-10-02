import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, BadgeCheck, ArrowRight } from 'lucide-react';
import { StatCard, type Stat } from '../../components/dashboard/StatCard';
import { SmsUsageChart } from '../../components/dashboard/SmsUsageChart';
import { PlatformDonutChart } from '../../components/dashboard/PlatformDonutChart';
import { ProjectsTable } from '../../components/dashboard/ProjectsTable';
import { RecentBatches } from '../../components/dashboard/RecentBatches';
import { RecentWalletActivity } from '../../components/dashboard/RecentWalletActivity';
import { LowBalanceAlerts } from '../../components/dashboard/LowBalanceAlerts';
import { PlatformHealth } from '../../components/dashboard/PlatformHealth';
import { useApi } from '../../lib/useApi';
import type {
  DashboardResponse,
  WalletListResponse,
  PendingQueue,
} from '@profjero/shared';

export function DashboardPage() {
  const navigate = useNavigate();
  const dashApi = useApi<DashboardResponse>('/admin/dashboard');
  const walletsApi = useApi<WalletListResponse>('/admin/wallets');
  const senderQueueApi = useApi<PendingQueue>('/admin/sender-ids/queue');

  const loading = dashApi.loading || walletsApi.loading;
  const error = dashApi.error || walletsApi.error;
  const reload = () => {
    dashApi.reload();
    walletsApi.reload();
    senderQueueApi.reload();
  };

  const dash = dashApi.data;
  const wallets = walletsApi.data?.wallets ?? [];
  const queue = senderQueueApi.data;

  const stats: Stat[] = dash
    ? [
        {
          title: 'Total Projects',
          value: dash.counts.totalProjects.toLocaleString(),
          footnote: `${dash.counts.activeProjects} active`,
          icon: 'projects',
          iconBg: 'bg-blue-600',
        },
        {
          title: 'Active Projects',
          value: dash.counts.activeProjects.toLocaleString(),
          footnote:
            dash.counts.suspendedProjects > 0
              ? `${dash.counts.suspendedProjects} suspended`
              : 'All systems go',
          icon: 'active',
          iconBg: 'bg-emerald-500',
        },
        {
          title: 'SMS Submitted',
          value: dash.smsTotals.totalSubmitted.toLocaleString(),
          footnote: `of ${dash.smsTotals.totalRecipients.toLocaleString()} recipients`,
          icon: 'send',
          iconBg: 'bg-indigo-600',
        },
        {
          title: 'Failed Messages',
          value: dash.smsTotals.totalFailed.toLocaleString(),
          footnote:
            dash.smsTotals.totalRecipients > 0
              ? `${(
                  (dash.smsTotals.totalFailed /
                    dash.smsTotals.totalRecipients) *
                  100
                ).toFixed(1)}% of total`
              : 'No data',
          icon: 'failed',
          iconBg: 'bg-rose-500',
        },
        {
          title: 'Unknown Messages',
          value: dash.smsTotals.totalUnknown.toLocaleString(),
          footnote: 'Awaiting reconciliation',
          icon: 'unknown',
          iconBg: 'bg-amber-500',
        },
        {
          title: 'Units Available',
          subtitle: '(All Wallets)',
          value: dash.walletTotals.totalAvailableUnits.toLocaleString(),
          footnote: `${dash.counts.fundedWallets} of ${dash.counts.totalWallets} funded`,
          icon: 'wallet',
          iconBg: 'bg-blue-600',
        },
        {
          title: 'Units Reserved',
          value: dash.walletTotals.totalReservedUnits.toLocaleString(),
          footnote: 'Held for in-flight SMS',
          icon: 'lock',
          iconBg: 'bg-purple-600',
        },
        {
          title: 'Total Batches',
          value: dash.smsTotals.totalBatches.toLocaleString(),
          footnote: 'All-time SMS batches',
          icon: 'package',
          iconBg: 'bg-teal-600',
        },
      ]
    : [];

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <h1 className="sr-only">Dashboard</h1>
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load dashboard.</div>
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

      {/* Pending Sender ID requests alert */}
      {queue && queue.total > 0 && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber-900">
              {queue.total} Sender ID{' '}
              {queue.total === 1 ? 'request' : 'requests'} pending
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {queue.pendingValues.length > 0 &&
                `${queue.pendingValues.length} new value${
                  queue.pendingValues.length === 1 ? '' : 's'
                } to register with Arkesel`}
              {queue.pendingValues.length > 0 &&
                queue.pendingAssignments.length > 0 &&
                ' · '}
              {queue.pendingAssignments.length > 0 &&
                `${queue.pendingAssignments.length} project assignment${
                  queue.pendingAssignments.length === 1 ? '' : 's'
                } awaiting access`}
            </p>
          </div>
          <Link
            to="/sender-ids"
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 shrink-0 flex items-center gap-1 self-center"
          >
            Review
            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </Link>
        </div>
      )}

      <section aria-label="Metrics Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && !dash
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-xl border border-slate-200/80 animate-pulse"
                />
              ))
            : stats.map((s) => <StatCard key={s.title} stat={s} />)}
        </div>
      </section>

      {dash && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SmsUsageChart daily={dash.daily} />
              <PlatformDonutChart
                topProjects={dash.topProjects}
                totalSubmitted={dash.smsTotals.totalSubmitted}
              />
            </div>
            <ProjectsTable
              topProjects={dash.topProjects}
              onProjectClick={(id) => navigate(`/projects/${id}`)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RecentBatches batches={dash.recentBatches} />
              <RecentWalletActivity transactions={dash.recentTransactions} />
            </div>
          </div>

          <div className="xl:col-span-4 space-y-5">
            <LowBalanceAlerts
              entries={wallets}
              onProjectClick={(id) => navigate(`/projects/${id}`)}
            />
            <PlatformHealth smsTotals={dash.smsTotals} />
          </div>
        </div>
      )}
    </main>
  );
}