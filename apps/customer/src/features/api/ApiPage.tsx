import { Code2, MessageSquare, Package, AlertTriangle, Link2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApiKeysCard } from '../../components/api/ApiKeysCard';
import { QuickStart } from '../../components/api/QuickStart';
import { MessagingStatCard } from '../../components/messaging/MessagingStatCard';
import { ErrorState } from '../../components/ui/States';
import { useApi } from '../../lib/useApi';
import type { CustomerSenderId, SmsStats } from '../../lib/types';

export function ApiPage() {
  const stats = useApi<SmsStats>('/customer/sms/stats?days=30');
  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const api = stats.data?.bySource.api;
  const firstApproved = senderIds.data?.senderIds.find((s) => s.status === 'approved')?.value ?? null;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      <PageHeader
        icon={Code2}
        title="API & Integrations"
        subtitle="Send SMS from your own website, app or system using the ProfJero Connect API."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">API usage — last 30 days</h2>
        {stats.error ? (
          <ErrorState error={stats.error} onRetry={stats.refresh} className="m-0" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MessagingStatCard
              loading={stats.loading && !stats.data}
              stat={{ label: 'API sends', value: (api?.batches ?? 0).toLocaleString(), footnote: 'Requests that created a send', icon: Link2, iconBg: 'bg-purple-500' }}
            />
            <MessagingStatCard
              loading={stats.loading && !stats.data}
              stat={{ label: 'SMS sent via API', value: (api?.messages ?? 0).toLocaleString(), footnote: `${(api?.unitsUsed ?? 0).toLocaleString()} units used`, icon: MessageSquare, iconBg: 'bg-blue-500' }}
            />
            <MessagingStatCard
              loading={stats.loading && !stats.data}
              stat={{ label: 'Failed via API', value: (api?.failed ?? 0).toLocaleString(), footnote: 'Units returned to wallet', icon: api && api.failed > 0 ? AlertTriangle : Package, iconBg: 'bg-rose-500' }}
            />
          </div>
        )}
      </section>

      <ApiKeysCard />
      <QuickStart senderId={firstApproved} />
    </main>
  );
}
