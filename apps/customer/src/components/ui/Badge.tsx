import { cn } from '../../lib/utils';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';

const TONES: Record<BadgeTone, { box: string; dot: string }> = {
  success: {
    box: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  danger: {
    box: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    dot: 'bg-rose-500',
  },
  warning: {
    box: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  info: {
    box: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  neutral: {
    box: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  purple: {
    box: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    dot: 'bg-purple-500',
  },
};

export function Badge({ tone, label, className }: { tone: BadgeTone; label: string; className?: string }) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap w-fit',
        t.box,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', t.dot)} />
      {label}
    </span>
  );
}
