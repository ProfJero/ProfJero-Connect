import { ArrowUp, ArrowDown } from 'lucide-react';
import { contactStats, type ContactStat } from '../../mock/contacts';
import { cn } from '../../lib/utils';

export function ContactsStats() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {contactStats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </section>
  );
}

function StatCard({ stat }: { stat: ContactStat }) {
  const Icon = stat.icon;
  const Arrow = stat.deltaDirection === 'up' ? ArrowUp : ArrowDown;
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', stat.iconBg, stat.iconColor)}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            {stat.label}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {stat.value}
            </span>
            <span
              className={cn(
                'inline-flex items-center text-[11px] font-bold',
                stat.deltaTone === 'emerald'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400',
              )}
            >
              <Arrow className="w-3 h-3 mr-0.5" strokeWidth={2.5} />
              {stat.delta}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
            {stat.footnote}
          </span>
        </div>
      </div>
    </div>
  );
}