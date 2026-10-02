import { Mail, Package, Banknote, AtSign } from 'lucide-react';
import { WelcomeHeader } from '../../components/dashboard/WelcomeHeader';
import { BalanceCard } from '../../components/dashboard/BalanceCard';
import { QuickActionsCard } from '../../components/dashboard/QuickActionsCard';
import { MetricCard, type MetricCardData } from '../../components/dashboard/MetricCard';
import { SmsUsageChart } from '../../components/dashboard/SmsUsageChart';
import { RecentTransactions } from '../../components/dashboard/RecentTransactions';
import { ServiceOverview } from '../../components/dashboard/ServiceOverview';
import { RecentNotifications } from '../../components/dashboard/RecentNotifications';
import { ApiBanner } from '../../components/dashboard/ApiBanner';
import { useApi } from '../../lib/useApi';
import { deltaLabel, formatGhs } from '../../lib/format';
import type { CustomerApiKey, CustomerPayment, CustomerSenderId, SmsStats } from '../../lib/types';

export function DashboardPage() {
  const stats = useApi<SmsStats>('/customer/sms/stats?days=30');
  const payments = useApi<{ payments: CustomerPayment[]; summary: { paidThisMonthGhs: number } }>(
    '/customer/payments?limit=1',
  );
  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const keys = useApi<{ apiKeys: CustomerApiKey[] }>('/customer/api-keys');

  const spent = payments.data?.summary.paidThisMonthGhs ?? 0;
  const approved = (senderIds.data?.senderIds ?? []).filter((s) => s.status === 'approved').length;
  const pending = (senderIds.data?.senderIds ?? []).filter((s) => s.status === 'pending').length;
  const c = stats.data?.current;
  const p = stats.data?.previous;
  const delta = (cur: number, prev: number) => {
    const l = deltaLabel(cur, prev);
    return l ? { text: l.text, good: l.up } : null;
  };

  const metrics: Array<{ data: MetricCardData; loading: boolean }> = [
    {
      loading: stats.loading && !stats.data,
      data: {
        label: 'SMS sent (30 days)',
        value: (c?.messages ?? 0).toLocaleString(),
        delta: c && p ? delta(c.messages, p.messages) : null,
        footer: p && p.messages > 0 ? 'vs. previous 30 days' : 'messages',
        icon: Mail,
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        iconColor: 'text-[#1764e0] dark:text-blue-400',
      },
    },
    {
      loading: stats.loading && !stats.data,
      data: {
        label: 'Units used (30 days)',
        value: (c?.unitsUsed ?? 0).toLocaleString(),
        delta: c && p ? delta(c.unitsUsed, p.unitsUsed) : null,
        footer: p && p.unitsUsed > 0 ? 'vs. previous 30 days' : 'units',
        icon: Package,
        iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
      },
    },
    {
      loading: payments.loading && !payments.data,
      data: {
        label: 'Top-ups this month',
        value: formatGhs(spent),
        footer: 'paid into your wallet',
        icon: Banknote,
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
      },
    },
    {
      loading: senderIds.loading && !senderIds.data,
      data: {
        label: 'Active Sender IDs',
        value: approved.toLocaleString(),
        footer: pending > 0 ? `${pending} awaiting approval` : approved === 0 ? 'request one to start sending' : 'ready to use',
        icon: AtSign,
        iconBg: 'bg-sky-50 dark:bg-sky-500/10',
        iconColor: 'text-sky-600 dark:text-sky-400',
      },
    },
  ];

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto w-full flex-1">
      <WelcomeHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BalanceCard />
        <QuickActionsCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.data.label} metric={m.data} loading={m.loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <SmsUsageChart stats={stats.data} loading={stats.loading} />
          <RecentTransactions />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <ServiceOverview activeKeys={keys.data ? keys.data.apiKeys.filter((k) => k.status === 'active').length : null} />
          <RecentNotifications />
          <ApiBanner />
        </div>
      </div>
    </main>
  );
}
