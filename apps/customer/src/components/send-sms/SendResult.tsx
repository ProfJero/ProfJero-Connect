import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, CalendarClock } from 'lucide-react';
import { btnPrimary, btnSecondary } from '../ui/buttons';
import { useApi } from '../../lib/useApi';
import { useRefreshAccount } from '../../lib/account';
import type { BatchWithRecords, SmsBatch } from '../../lib/types';

/**
 * Outcome of a send, shown in place of the form. Sends are accepted
 * instantly and delivered in the background, so this follows the batch
 * live (every 2 s) until the network has answered for every recipient.
 */
export function SendResult({ batch: initial, onNew }: { batch: SmsBatch; onNew: () => void }) {
  const live = useApi<BatchWithRecords>(`/customer/sms/batches/${encodeURIComponent(initial.id)}`);
  const refreshAccount = useRefreshAccount();
  const batch = live.data?.batch ?? initial;
  const records = live.data?.records ?? [];
  const inProgress = batch.status === 'submitting' || batch.status === 'queued';
  const reload = live.refresh;

  useEffect(() => {
    if (!inProgress) {
      refreshAccount();
      return;
    }
    const id = window.setInterval(reload, 2000);
    return () => window.clearInterval(id);
  }, [inProgress, reload, refreshAccount]);

  const done = records.filter((r) => r.status !== 'queued' && r.status !== 'submitting').length;
  const total = batch.totalRecipients;
  const allOk = batch.failedCount === 0 && batch.unknownCount === 0;
  const noneOk = batch.submittedCount === 0;
  const Icon = inProgress ? Loader2 : allOk ? CheckCircle2 : noneOk ? XCircle : AlertTriangle;
  const color = inProgress ? 'text-[#1764e0] animate-spin' : allOk ? 'text-emerald-500' : noneOk ? 'text-rose-500' : 'text-amber-500';

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-8 text-center" aria-live="polite">
      <Icon className={`w-12 h-12 mx-auto ${color}`} strokeWidth={1.75} />
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">
        {inProgress ? 'Sending your message…' : allOk ? 'Message sent' : noneOk ? 'Message not sent' : 'Message partly sent'}
      </h2>

      {inProgress ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {total.toLocaleString()} recipient{total === 1 ? '' : 's'} · your units are reserved. You can leave this page —
            sending continues and the result appears in Message History.
          </p>
          <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Sending progress">
            <div className="h-full bg-[#1764e0] transition-all duration-500" style={{ width: `${total ? Math.max(4, (done / total) * 100) : 4}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {done.toLocaleString()} of {total.toLocaleString()} handed to the network
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {batch.submittedCount.toLocaleString()} of {batch.totalRecipients.toLocaleString()} accepted by the network
            {batch.failedCount > 0 && ` · ${batch.failedCount.toLocaleString()} failed`}
            {batch.unknownCount > 0 && ` · ${batch.unknownCount.toLocaleString()} awaiting confirmation`}.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {batch.totalUnitsCharged.toLocaleString()} units charged
            {batch.totalUnitsReleased > 0 && ` · ${batch.totalUnitsReleased.toLocaleString()} returned to your wallet`}.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            "Accepted" means the network has the message. Delivery to each phone is confirmed separately and shown in
            Message History.
          </p>
        </>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Link to={`/messaging/history/${encodeURIComponent(batch.id)}`} className={btnPrimary}>
          View delivery details
        </Link>
        <button type="button" onClick={onNew} className={btnSecondary}>
          Send another message
        </button>
      </div>
    </div>
  );
}

/** Confirmation after scheduling a send for later. */
export function ScheduledResult({ name, at, onNew }: { name: string; at: string; onNew: () => void }) {
  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-8 text-center" role="status">
      <CalendarClock className="w-12 h-12 mx-auto text-[#1764e0]" strokeWidth={1.75} />
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">Scheduled</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
        “{name}” will be sent on <strong>{new Date(at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>.
        Units are taken when it sends — keep enough in your wallet.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Link to="/messaging/campaigns" className={btnPrimary}>
          View campaigns
        </Link>
        <button type="button" onClick={onNew} className={btnSecondary}>
          Send another message
        </button>
      </div>
    </div>
  );
}
