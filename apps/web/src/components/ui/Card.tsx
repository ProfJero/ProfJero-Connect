import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-xs', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 flex items-center justify-between border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-bold text-slate-800 text-sm">{children}</h3>;
}

export function ViewAllLink({ label = 'View all' }: { label?: string }) {
  return (
    <a className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1" href="#">
      {label}
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}