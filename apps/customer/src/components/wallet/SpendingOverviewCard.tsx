import { BarChart3, Calendar, ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { spendingData, spendingPeriods } from '../../mock/wallet';

const COLORS = {
  sms: '#1a6cf0',
  data: '#06b6d4',
  airtime: '#10b981',
  other: '#818cf8',
};

export function SpendingOverviewCard() {
  return (
    <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400">
            <BarChart3 className="w-4 h-4" strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Spending Overview
          </h3>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
          <span>{spendingPeriods[0]}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={2} />
        </button>
      </div>

      {/* Chart */}
      <div className="py-4 h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spendingData} barCategoryGap="28%">
            <CartesianGrid stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                color: '#fff',
                fontSize: 11,
              }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            />
            <Bar dataKey="sms" stackId="a" fill={COLORS.sms} />
            <Bar dataKey="data" stackId="a" fill={COLORS.data} />
            <Bar dataKey="airtime" stackId="a" fill={COLORS.airtime} radius={[4, 4, 0, 0]} />
            <Bar dataKey="other" stackId="a" fill={COLORS.other} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <LegendDot color={COLORS.sms} label="SMS" />
        <LegendDot color={COLORS.data} label="Data" />
        <LegendDot color={COLORS.airtime} label="Airtime" />
        <LegendDot color={COLORS.other} label="Other" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}