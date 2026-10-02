import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </section>
  );
}
