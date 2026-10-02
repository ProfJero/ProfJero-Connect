import { cn } from '../../lib/utils';

export function StatusDot({ status }: { status: 'Active' | 'Suspended' }) {
  const color = status === 'Active' ? 'text-emerald-700' : 'text-rose-600';
  const dot = status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {status}
    </span>
  );
}