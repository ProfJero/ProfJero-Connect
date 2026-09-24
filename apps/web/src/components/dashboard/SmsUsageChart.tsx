import { Card } from '../ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardDailyPoint } from '@profjero/shared';

interface Props {
  daily: DashboardDailyPoint[];
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function SmsUsageChart({ daily }: Props) {
  const data = daily.map((d) => ({
    day: shortDate(d.date),
    submitted: d.submitted,
    failed: d.failed,
  }));

  const hasData = data.some((d) => d.submitted > 0 || d.failed > 0);

  return (
    <Card className="p-5" data-purpose="sms-usage-chart">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">SMS Activity</h3>
        <span className="text-[11px] text-slate-400">Last 7 days</span>
      </div>

      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
          No SMS activity in the last 7 days.
        </div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976d2" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1976d2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="submitted"
                stroke="#1976d2"
                strokeWidth={2}
                fill="url(#gradSubmitted)"
                name="Submitted"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#gradFailed)"
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}