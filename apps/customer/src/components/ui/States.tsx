import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react';
import { errorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin',
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** Placeholder rows while a list loads. Never fake data — just shapes. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3 p-5', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-12 text-center', className)}>
      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'm-4 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300',
        className,
      )}
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
      <div className="flex-1 min-w-0">{errorMessage(error)}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  );
}

/** Inline banner for form/action results. */
export function Notice({
  tone,
  children,
  className,
}: {
  tone: 'success' | 'error' | 'info' | 'warning';
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    success: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    error: 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
    info: 'border-blue-100 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/10 text-slate-700 dark:text-slate-300',
    warning: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border p-3 text-xs leading-relaxed', styles, className)}>
      {children}
    </div>
  );
}
