import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { platformDonutData } from '../../mock/dashboard';

export function PlatformDonutChart() {
  return (
    <Card className="p-5 flex flex-col justify-between">
      <h3 className="font-bold text-slate-800 text-sm mb-2">SMS Usage by Platform</h3>
      <div className="flex items-center justify-between gap-2 my-auto">
        <div className="relative w-44 h-44 mx-auto shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformDonutData}
                dataKey="value"
                innerRadius={62}
                outerRadius={88}
                stroke="#fff"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              >
                {platformDonutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 11,
                }}
                formatter={(value) => `${value}%`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold text-slate-800 leading-tight">8,450</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-tight">Total SMS</span>
          </div>
        </div>

        <div className="space-y-2 text-xs pr-2 shrink-0">
          {platformDonutData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-bold text-slate-800">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}