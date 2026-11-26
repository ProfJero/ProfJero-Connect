import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AtSign, Plus, Info } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';
import { TableScroll } from '../../components/ui/TableScroll';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { btnPrimary, cardClass } from '../../components/ui/buttons';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import { SENDER_ID_PROVIDER_STATUS, SENDER_ID_STATUS } from '../../lib/statusLabels';
import { cn } from '../../lib/utils';
import type { CustomerSenderId, SenderIdStatus } from '../../lib/types';
import { usePlatformConfig } from '../../lib/account';

const FILTERS: Array<{ id: SenderIdStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Not approved' },
  { id: 'revoked', label: 'Inactive' },
];

export function SenderIdsPage() {
  const { senderIdReviewSla } = usePlatformConfig();
  const { data, loading, error, refresh } = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const [filter, setFilter] = useState<SenderIdStatus | 'all'>('all');
  const all = data?.senderIds ?? [];
  const rows = filter === 'all' ? all : all.filter((s) => s.status === filter);
  const just = (useLocation().state ?? null) as { requested?: string; decision?: 'approved' | 'review' } | null;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      <PageHeader
        icon={AtSign}
        title="Sender IDs"
        subtitle="The names recipients see when you message them."
        actions={
          <Link to="/messaging/sender-ids/request" className={btnPrimary}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Request Sender ID
          </Link>
        }
      />

      <MessagingTabs />

      {just?.requested && (
        <div role="status" className={cn('rounded-xl p-4 text-xs border', just.decision === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-100' : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100')}>
          {just.decision === 'approved' ? (
            <>
              <p className="font-bold">"{just.requested}" is approved and ready to use.</p>
              <p className="mt-0.5">Send your first message from it now — our SMS provider verifies it with the networks on that first send.</p>
              <Link to="/messaging/sms" className="mt-2 inline-block font-bold underline">Send a message</Link>
            </>
          ) : (
            <>
              <p className="font-bold">"{just.requested}" is with our team for a quick review.</p>
              <p className="mt-0.5">This usually takes {senderIdReviewSla}. We'll notify you as soon as it's decided.</p>
            </>
          )}
        </div>
      )}

      <div className="bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
        <div className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">How Sender IDs are approved</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>We check every request automatically. Names that clearly belong to you are approved instantly; anything that could impersonate a government body, bank, network or brand is refused or reviewed by our team.</li>
            <li><strong>Verification is done by our SMS provider</strong> with the mobile networks when you send your first message from the Sender ID. Its status shows below.</li>
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.id === 'all' ? all.length : all.filter((s) => s.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
                filter === f.id
                  ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300',
              )}
            >
              {f.label} <span className="opacity-70 font-normal">{count}</span>
            </button>
          );
        })}
      </div>

      <div className={cn(cardClass, 'overflow-hidden')}>
        {loading && !data ? (
          <SkeletonRows />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : all.length === 0 ? (
          <EmptyState
            icon={AtSign}
            title="No Sender IDs yet"
            description="Request a Sender ID — usually your business or brand name — to start sending messages."
            action={
              <Link to="/messaging/sender-ids/request" className={btnPrimary}>
                Request your first Sender ID
              </Link>
            }
          />
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">No Sender IDs with this status.</p>
        ) : (
          <TableScroll>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
                  <th className="py-3.5 px-5 whitespace-nowrap">Sender ID</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Purpose</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Provider verification</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Requested</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Decided</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {rows.map((row) => {
                  const s = SENDER_ID_STATUS[row.status];
                  return (
                    <tr key={row.value} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors align-top">
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 tracking-wide whitespace-nowrap">
                        {row.value}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400 leading-snug min-w-[200px]">
                        {row.purpose ?? '—'}
                        {row.reason && (
                          <span className="block mt-1 text-[11px] text-rose-600 dark:text-rose-400">Reason: {row.reason}</span>
                        )}
                        {row.status === 'pending' && row.checks.length > 0 && (
                          <span className="block mt-1 text-[11px] text-amber-700 dark:text-amber-300">Being reviewed because: {row.checks.join(' ')}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <Badge tone={s.tone} label={s.label} />
                      </td>
                      <td className="py-4 px-5 min-w-[180px]">
                        {row.providerStatus ? (
                          <>
                            <Badge tone={SENDER_ID_PROVIDER_STATUS[row.providerStatus].tone} label={SENDER_ID_PROVIDER_STATUS[row.providerStatus].label} />
                            <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{SENDER_ID_PROVIDER_STATUS[row.providerStatus].hint}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateTime(row.requestedAt)}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {row.decidedAt ? formatDateTime(row.decidedAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </div>
    </main>
  );
}
