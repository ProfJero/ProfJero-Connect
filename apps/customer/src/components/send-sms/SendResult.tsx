import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { btnPrimary, btnSecondary } from '../ui/buttons';
import type { SmsBatch } from '../../lib/types';

/** Outcome of a send, shown in place of the form. */
export function SendResult({ batch, onNew }: { batch: SmsBatch; onNew: () => void }) {
  const allOk = batch.failedCount === 0 && batch.unknownCount === 0;
  const noneOk = batch.submittedCount === 0;
  const Icon = allOk ? CheckCircle2 : noneOk ? XCircle : AlertTriangle;
  const color = allOk ? 'text-emerald-500' : noneOk ? 'text-rose-500' : 'text-amber-500';

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-8 text-center">
      <Icon className={`w-12 h-12 mx-auto ${color}`} strokeWidth={1.75} />
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">
        {allOk ? 'Message sent' : noneOk ? 'Message not sent' : 'Message partly sent'}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
        {batch.submittedCount.toLocaleString()} of {batch.totalRecipients.toLocaleString()} accepted by the network
        {batch.failedCount > 0 && ` · ${batch.failedCount.toLocaleString()} failed`}
        {batch.unknownCount > 0 && ` · ${batch.unknownCount.toLocaleString()} awaiting confirmation`}.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {batch.totalUnitsCharged.toLocaleString()} units charged
        {batch.totalUnitsReleased > 0 && ` · ${batch.totalUnitsReleased.toLocaleString()} returned to your wallet`}.
      </p>
      <p className="text-[11px] text-slate-400 mt-3">
        "Accepted" means the network has the message. Delivery to each phone is confirmed separately and shown in
        Message History.
      </p>
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
