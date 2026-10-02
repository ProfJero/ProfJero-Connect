import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import type { DonutSegment } from '../../lib/reportAggregation';

interface Props {
  segments: DonutSegment[];
  totalUnits: number;
}

export function UnitConsumptionDonut({ segments, totalUnits }: Props) {
  return (
    <Card className="p-5" data-purpose="unit-consumption">
      <h3 className="text-sm font-bold text-slate-900">Unit Consumption by Project</h3>
      <p className="text-xs text-slate-500 mb-4">Share of total units consumed.</p>

      {segments.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-xs text-slate-500">
          No units consumed in this period.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={68}
                  stroke="#fff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {segments.map((seg) => (
                    <Cell key={seg.name} fill={seg.color} />
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
                  formatter={(v) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {totalUnits.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">Units Used</span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 pl-3 text-xs">
            {segments.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-semibold text-slate-800 shrink-0">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}