import { Link } from 'react-router-dom';
import { MessageSquare, Send, Inbox } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';
import { MessagingStatCard } from '../../components/messaging/MessagingStatCard';
import { BatchesTable } from '../../components/messaging/BatchesTable';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { btnPrimary, cardClass } from '../../components/ui/buttons';
import { useApi } from '../../lib/useApi';
import { smsStatCards } from '../../lib/smsStats';
import type { SmsBatch, SmsStats } from '../../lib/types';

export function MessagingOverviewPage() {
  const stats = useApi<SmsStats>('/customer/sms/stats?days=30');
  const recent = useApi<{ batches: SmsBatch[] }>('/customer/sms/batches?limit=8');

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <PageHeader
        icon={MessageSquare}
        title="Messaging"
        subtitle="Send messages and track your SMS activity."
        actions={
          <Link to="/messaging/sms" className={btnPrimary}>
            <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
            Send SMS
          </Link>
        }
      />

      <MessagingTabs />

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Last 30 days</h3>
        {stats.error ? (
          <ErrorState error={stats.error} onRetry={stats.refresh} className="m-0" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {smsStatCards(stats.data).map((stat) => (
              <MessagingStatCard key={stat.label} stat={stat} loading={stats.loading && !stats.data} />
            ))}
          </div>
        )}
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Messages</h3>
          <Link to="/messaging/history" className="text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
            View all →
          </Link>
        </div>
        {recent.loading && !recent.data ? (
          <SkeletonRows />
        ) : recent.error ? (
          <ErrorState error={recent.error} onRetry={recent.refresh} />
        ) : (recent.data?.batches.length ?? 0) === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            description="Messages you send from here or through the API will appear in this list."
            action={
              <Link to="/messaging/sms" className={btnPrimary}>
                Send your first SMS
              </Link>
            }
          />
        ) : (
          <BatchesTable batches={recent.data!.batches} />
        )}
      </section>
    </main>
  );
}
