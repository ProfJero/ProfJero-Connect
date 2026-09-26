import type { SenderIdStatus } from '../../mock/senderIds';
import { cn } from '../../lib/utils';

const STYLES: Record<
  SenderIdStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  Approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  'Pending Approval': {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  Rejected: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
  Inactive: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

export function SenderIdStatusBadge({ status }: { status: SenderIdStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border',
        s.bg,
        s.text,
        s.border,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', s.dot)} />
      {status}
    </span>
  );
}