import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '../ui/Card';
import { usageChartData } from '../../mock/dashboard';

export function SmsUsageChart() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">SMS Usage Overview</h3>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 font-medium">SMS Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-600 font-medium">Units Used</span>
          </div>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={usageChartData} barGap={6} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 2000]}
              ticks={[0, 500, 1000, 1500, 2000]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: 6,
                padding: 10,
                color: '#fff',
                fontSize: 11,
              }}
            />
            <Bar dataKey="sms" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="units" fill="#0d9488" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}