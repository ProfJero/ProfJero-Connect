import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { revenueCostData } from '../../mock/reports';

export function RevenueCostChart() {
  return (
    <Card className="p-5 flex flex-col" data-purpose="revenue-cost">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-900">Revenue &amp; Cost Analysis</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Arkesel Cost (Est.)</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">Financial performance and margins.</p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueCostData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 20000]}
              ticks={[0, 5000, 10000, 15000, 20000]}
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
            <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cost" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}