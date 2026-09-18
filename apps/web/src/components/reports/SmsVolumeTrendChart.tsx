import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { smsVolumeTrendData } from '../../mock/reports';

export function SmsVolumeTrendChart() {
  return (
    <Card className="p-5 flex flex-col" data-purpose="sms-volume-trend">
      <h3 className="text-sm font-bold text-slate-900">SMS Volume Trend</h3>
      <p className="text-xs text-slate-400 mb-4">Total SMS sent over the selected period.</p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={smsVolumeTrendData} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="period"
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
            <Bar dataKey="sent" fill="#2563eb" radius={[3, 3, 0, 0]} />
            <Bar dataKey="consumed" fill="#60a5fa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}