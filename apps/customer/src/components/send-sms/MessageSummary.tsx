import { Link } from 'react-router-dom';
import { FileText, Users, AlignJustify, Package, Wallet, Check, Send, AlertTriangle } from 'lucide-react';
import { Notice, Spinner } from '../ui/States';
import { cn } from '../../lib/utils';

export function MessageSummary({
  senderId,
  recipientCount,
  isUpperBound,
  segments,
  balance,
  canSend,
  blockers,
  sending,
  error,
  onSend,
}: {
  senderId: string | null;
  recipientCount: number;
  isUpperBound: boolean;
  segments: number;
  balance: number | null;
  canSend: boolean;
  blockers: string[];
  sending: boolean;
  error: string | null;
  onSend: () => void;
}) {
  const units = recipientCount * segments;
  const sufficient = balance !== null && units <= balance;
  const prefix = isUpperBound ? 'up to ' : '';

  return (
    <aside className="lg:col-span-4 lg:sticky lg:top-24">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-blue-500" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Message Summary</h3>
        </div>

        <div className="space-y-3">
          <Row icon={Package} label="Sender ID" value={senderId ?? '—'} />
          <Row icon={Users} label="Recipients" value={`${prefix}${recipientCount.toLocaleString()}`} />
          <Row icon={AlignJustify} label="Pages per message" value={segments.toString()} />
          <Row icon={Package} label="Units needed" value={`${prefix}${units.toLocaleString()}`} strong />
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-blue-500" strokeWidth={2} />
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">Wallet balance</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {balance === null ? '—' : `${balance.toLocaleString()} units`}
              </div>
            </div>
          </div>
          <Link to="/wallet/add-funds" className="text-[11px] font-semibold text-[#1a6cf0] dark:text-blue-400 hover:underline">
            Top up
          </Link>
        </div>

        {recipientCount > 0 && balance !== null && (
          <div
            className={cn(
              'rounded-lg p-3 flex items-start gap-2.5 border',
              sufficient
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0',
                sufficient ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            >
              {sufficient ? <Check className="w-3 h-3" strokeWidth={3} /> : <AlertTriangle className="w-3 h-3" strokeWidth={3} />}
            </div>
            <div className="text-[11px]">
              <div className={cn('font-semibold', sufficient ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                {sufficient ? 'Sufficient balance' : 'Not enough units'}
              </div>
              <div className={sufficient ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-400'}>
                {sufficient
                  ? `${(balance - units).toLocaleString()} units will remain${isUpperBound ? ' (at least)' : ''}.`
                  : `You need ${(units - balance).toLocaleString()} more units${isUpperBound ? ' (at most)' : ''}.`}
              </div>
            </div>
          </div>
        )}

        {blockers.length > 0 && (
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend || sending}
          className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white py-2.5 px-4 rounded-lg font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? <Spinner /> : <Send className="w-4 h-4 -rotate-45" strokeWidth={2} />}
          <span>
            {sending
              ? 'Sending…'
              : recipientCount > 0
                ? `Send to ${prefix}${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? '' : 's'}`
                : 'Send Message'}
          </span>
        </button>
      </div>
    </aside>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs gap-3">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon className="w-4 h-4 text-blue-500" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <span className={cn('text-slate-800 dark:text-slate-100 text-right', strong ? 'font-extrabold' : 'font-bold')}>{value}</span>
    </div>
  );
}
