import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

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

export function ViewAllLink({
  label = 'View all',
  href,
}: {
  label?: string;
  href: string;
}) {
  return (
    <Link to={href} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
      {label} →
    </Link>
  );
}
