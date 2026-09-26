import { ArrowLeftRight, MessageSquare, AlertTriangle, Calendar, ChevronDown, BarChart3, type LucideIcon } from 'lucide-react';
import { usageMetrics, usagePeriods, type UsageMetric } from '../../mock/api';
import { cn } from '../../lib/utils';

const ICONS: Record<UsageMetric['icon'], LucideIcon> = {
  swap: ArrowLeftRight,
  sms: MessageSquare,
  alert: AlertTriangle,
};

export function UsageMetrics() {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2.5} />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Usage</h2>
        </div>

        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium py-1.5 px-3 rounded-lg flex items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" strokeWidth={2} />
          <span>{usagePeriods[0]}</span>
          <ChevronDown className="w-3 h-3 ml-2 text-slate-400 shrink-0" strokeWidth={2} />
        </button>
      </div>

      {/* 3 metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usageMetrics.map((metric) => {
          const Icon = ICONS[metric.icon];
          return (
            <div
              key={metric.label}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex items-start gap-4"
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                  metric.iconBg,
                  metric.iconColor,
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {metric.label}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {metric.value}
                </div>
                <div className="flex items-center text-[11px] mt-1 flex-wrap">
                  <span
                    className={cn(
                      'font-semibold',
                      metric.deltaTone === 'emerald'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400',
                    )}
                  >
                    {metric.delta}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                    {metric.footnote}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}