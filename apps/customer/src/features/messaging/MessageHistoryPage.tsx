import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, Inbox, Send } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';
import { BatchesTable } from '../../components/messaging/BatchesTable';
import { EmptyState, ErrorState, SkeletonRows, Spinner } from '../../components/ui/States';
import { btnPrimary, btnSecondary, cardClass, inputClass } from '../../components/ui/buttons';
import { useApi, useCursorList } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { CustomerSenderId, SmsBatch } from '../../lib/types';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Sent' },
  { value: 'partial', label: 'Partially sent' },
  { value: 'failed', label: 'Failed' },
];

const SOURCE_FILTERS = [
  { value: '', label: 'All sources' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'api', label: 'API' },
];

export function MessageHistoryPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [senderId, setSenderId] = useState('');
  const deferredQ = useDeferredValue(q.trim());

  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const params = new URLSearchParams({ limit: '25' });
  if (deferredQ) params.set('q', deferredQ);
  if (status) params.set('status', status);
  if (source) params.set('source', source);
  if (senderId) params.set('senderId', senderId);
  const list = useCursorList<SmsBatch>(`/customer/sms/batches?${params}`, 'batches');
  const filtered = !!(deferredQ || status || source || senderId);

  const selectClass = cn(inputClass, 'w-auto cursor-pointer');

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <PageHeader
        icon={Clock}
        title="Message History"
        subtitle="Every message you've sent, with per-recipient delivery status."
        actions={
          <Link to="/messaging/sms" className={btnPrimary}>
            <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
            Send SMS
          </Link>
        }
      />

      <MessagingTabs />

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          <input
            className={cn(inputClass, 'pl-8')}
            placeholder="Search message text or reference…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className={selectClass} value={senderId} onChange={(e) => setSenderId(e.target.value)} aria-label="Sender ID">
          <option value="">All Sender IDs</option>
          {(senderIds.data?.senderIds ?? []).map((s) => (
            <option key={s.value} value={s.value}>
              {s.value}
            </option>
          ))}
        </select>
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select className={selectClass} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          {SOURCE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setStatus('');
              setSource('');
              setSenderId('');
            }}
            className="text-xs text-[#1a6cf0] dark:text-blue-400 font-medium px-2 py-1 hover:underline"
          >
            Clear
          </button>
        )}
        {list.refreshing && !list.loading && <Spinner className="text-slate-400" />}
      </section>

      <section className={cn(cardClass, 'overflow-hidden')}>
        {list.loading ? (
          <SkeletonRows rows={8} />
        ) : list.error && list.items.length === 0 ? (
          <ErrorState error={list.error} onRetry={list.refresh} />
        ) : list.items.length === 0 ? (
          filtered ? (
            <p className="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">No messages match these filters.</p>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No messages yet"
              description="When you send SMS — from the dashboard or the API — each send appears here."
              action={
                <Link to="/messaging/sms" className={btnPrimary}>
                  Send your first SMS
                </Link>
              }
            />
          )
        ) : (
          <>
            <BatchesTable batches={list.items} />
            {list.hasMore && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <button type="button" onClick={list.loadMore} disabled={list.loadingMore} className={btnSecondary}>
                  {list.loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
