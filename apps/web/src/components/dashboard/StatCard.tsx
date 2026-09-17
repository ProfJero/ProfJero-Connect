import type { Stat } from '../../mock/dashboard';
import { cn } from '../../lib/utils';

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  // For "Failed Messages" an upward arrow is bad news, so treat positive as default
  const trendPositive = stat.trend?.direction === 'up' || stat.title === 'Failed Messages';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
      <div
        className={cn(
          'w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm',
          stat.iconBg,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">
          {stat.title} {stat.subtitle && <span className="text-slate-400">{stat.subtitle}</span>}
        </div>
        <div className="text-xl font-bold text-slate-800 mt-0.5">{stat.value}</div>
        {stat.trend && (
          <div
            className={cn(
              'text-[11px] font-semibold flex items-center gap-1 mt-0.5',
              trendPositive ? 'text-emerald-600' : 'text-rose-500',
            )}
          >
            <span>
              {stat.trend.direction === 'up' ? '↑' : '↓'} {stat.trend.value}
            </span>
            <span className="text-slate-400 font-normal">{stat.trend.label}</span>
          </div>
        )}
        {!stat.trend && stat.footnote && (
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">{stat.footnote}</div>
        )}
      </div>
    </div>
  );
}