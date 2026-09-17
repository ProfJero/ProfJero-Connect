import { cn } from '../../lib/utils';

type Variant = 'success' | 'danger' | 'warning' | 'info';

const VARIANTS: Record<Variant, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
};

const STATUS_VARIANT: Record<string, Variant> = {
  Sent: 'success',
  Successful: 'success',
  Active: 'success',
  Failed: 'danger',
  Suspended: 'danger',
  Pending: 'warning',
};

export function StatusBadge({ status }: { status: string }) {
  const v = STATUS_VARIANT[status] ?? 'info';
  const style = VARIANTS[v];
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit', style.bg, style.text)}>
      <span className={cn('w-1 h-1 rounded-full', style.dot)} />
      {status}
    </span>
  );
}