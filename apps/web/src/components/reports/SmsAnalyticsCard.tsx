import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { DailyPoint } from '../../lib/reportAggregation';

export interface SmsAnalyticsSummary {
  dailySms: number;
  weeklySms: number;
  monthlySms: number;
  unitsConsumed: number;
  successRate: number; // 0-1
  failureRate: number; // 0-1
}

interface Props {
  daily: DailyPoint[];
  summary: SmsAnalyticsSummary;
  periodLabel: string;
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function SmsAnalyticsCard({ daily, summary, periodLabel }: Props) {
  const hasData = daily.some(
    (d) => d.recipients > 0 || d.submitted > 0 || d.failed > 0,
  );

  const summaryRows: Array<{ label: string; value: string; tone?: 'emerald' | 'rose' }> = [
    { label: 'Daily SMS', value: formatCount(summary.dailySms) },
    { label: 'Weekly SMS', value: formatCount(summary.weeklySms) },
    { label: 'Monthly SMS', value: formatCount(summary.monthlySms) },
    { label: 'Units Consumed', value: formatCount(summary.unitsConsumed) },
    { label: 'Success Rate', value: formatPct(summary.successRate), tone: 'emerald' },
    { label: 'Failure Rate', value: formatPct(summary.failureRate), tone: 'rose' },
  ];

  return (
    <Card className="p-5 lg:col-span-8" data-purpose="sms-analytics">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">SMS Analytics</h3>
          <p className="text-xs text-slate-400">
            Volume and performance overview · {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <LegendDot color="bg-blue-500" label="Total SMS" />
          <LegendDot color="bg-emerald-500" label="Successful" />
          <LegendDot color="bg-red-400" label="Failed" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 h-56">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No SMS activity in this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: 6,
                    padding: 8,
                    color: '#fff',
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="recipients"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="submitted"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: '#10b981' }}
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={1.8}
                  dot={{ r: 2.5, fill: '#ef4444' }}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="md:col-span-4 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 space-y-2.5">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between pb-1 border-b border-slate-100 last:border-0"
            >
              <span className="text-xs text-slate-500">{row.label}</span>
              <span
                className={cn(
                  'font-bold text-sm',
                  row.tone === 'emerald'
                    ? 'text-emerald-600'
                    : row.tone === 'rose'
                      ? 'text-rose-600'
                      : 'text-slate-800',
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
      <span>{label}</span>
    </div>
  );
}