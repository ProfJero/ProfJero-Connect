import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { usageTrendsData } from '../../mock/reports';

export function UsageTrendsChart() {
  return (
    <Card className="p-5 lg:col-span-4" data-purpose="usage-trends">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <LineIcon className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Usage Trends</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>SMS Sent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Units Consumed</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3">SMS and units consumption over time.</p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={usageTrendsData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 15000]}
              ticks={[0, 5000, 10000, 15000]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}K`}
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
              formatter={(v: number) => v.toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="sent"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#2563eb' }}
            />
            <Line
              type="monotone"
              dataKey="units"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}