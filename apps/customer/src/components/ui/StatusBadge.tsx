import { cn } from '../../lib/utils';

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'purple';

const VARIANTS: Record<Variant, { bg: string; text: string; dot: string; border: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-200' },
};

const STATUS_VARIANT: Record<string, Variant> = {
  Sent: 'success',
  Successful: 'success',
  Active: 'success',
  Delivered: 'success',
  Available: 'success',
  Failed: 'danger',
  Rejected: 'danger',
  Suspended: 'danger',
  Pending: 'warning',
  Refunded: 'purple',
};

export function StatusBadge({ status }: { status: string }) {
  const v = STATUS_VARIANT[status] ?? 'info';
  const s = VARIANTS[v];
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit border',
        s.bg,
        s.text,
        s.border,
      )}
    >
      <span className={cn('w-1 h-1 rounded-full', s.dot)} />
      {status}
    </span>
  );
}