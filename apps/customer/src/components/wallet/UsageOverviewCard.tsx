import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { SmsStats } from '../../lib/types';

const PERIODS = [7, 30, 90] as const;

/** Units charged per day for SMS. Data/Airtime join this once they launch. */
export function UsageOverviewCard() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  const { data, loading } = useApi<SmsStats>(`/customer/sms/stats?days=${days}`);
  const series = (data?.days === days ? data.series : []).map((d) => ({
    day: new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    units: d.units,
  }));
  const total = data?.days === days ? data.current.unitsUsed : null;

  return (
    <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#1764e0] dark:text-blue-400">
            <BarChart3 className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Units Used</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {total === null ? '—' : `${total.toLocaleString()} units in the last ${days} days`}
            </p>
          </div>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-semibold">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              className={cn('px-2.5 py-1.5', days === p ? 'bg-[#1a6cf0] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="py-4 h-56 sm:h-64 flex-1">
        {loading && series.length === 0 ? (
          <div className="h-full rounded-lg bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} barCategoryGap="28%">
              <CartesianGrid stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} minTickGap={12} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                formatter={(v) => [`${typeof v === 'number' ? v.toLocaleString() : v} units`, 'SMS']}
              />
              <Bar dataKey="units" fill="#1a6cf0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
