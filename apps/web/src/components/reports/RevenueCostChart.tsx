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

export function RevenueCostChart({ weeks }: Props) {
  const hasData = weeks.some((w) => w.revenuePesewas > 0);

  // Convert pesewas to GHS for chart scale readability.
  const data = weeks.map((w) => ({
    label: w.label,
    revenueGhs: w.revenuePesewas / 100,
    payments: w.payments,
  }));

  return (
    <Card className="p-5 flex flex-col" data-purpose="revenue-trend">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-900">Revenue Trend</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Revenue (GHS)</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Weekly revenue from successful payments.
      </p>

      {!hasData ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          No revenue in this period.
        </div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%">
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
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v))}
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
                formatter={(v, name) => {
                  const num = typeof v === 'number' ? v : Number(v ?? 0);
                  if (name === 'revenueGhs') return [`GHS ${num.toFixed(2)}`, 'Revenue'];
                  return [num, String(name)];
                }}
              />
              <Bar dataKey="revenueGhs" fill="#2563eb" radius={[3, 3, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}