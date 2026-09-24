import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import type { WeeklyPoint } from '../../lib/reportAggregation';

interface Props {
  weeks: WeeklyPoint[];
}

export function SmsVolumeTrendChart({ weeks }: Props) {
  const hasData = weeks.some((w) => w.recipients > 0 || w.units > 0);

  return (
    <Card className="p-5 flex flex-col" data-purpose="sms-volume-trend">
      <h3 className="text-sm font-bold text-slate-900">SMS Volume Trend</h3>
      <p className="text-xs text-slate-400 mb-4">Weekly SMS and units consumed.</p>

      {!hasData ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          No data for this period.
        </div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks} barGap={2} barCategoryGap="30%">
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
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
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
                formatter={(v) => (typeof v === 'number' ? v.toLocaleString() : String(v ?? ''))}
              />
              <Bar dataKey="recipients" fill="#2563eb" radius={[3, 3, 0, 0]} name="Sent" />
              <Bar dataKey="units" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Units" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}