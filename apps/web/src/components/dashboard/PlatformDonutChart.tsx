import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardResponse } from '@profjero/shared';

const COLORS = ['#1976d2', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];

interface Props {
  topProjects: DashboardResponse['topProjects'];
  totalSubmitted: number;
}

export function PlatformDonutChart({ topProjects, totalSubmitted }: Props) {
  const segments = topProjects.map((p, i) => ({
    name: p.projectName,
    value: p.submitted,
    color: COLORS[i % COLORS.length],
  }));

  const hasData = segments.some((s) => s.value > 0);

  return (
    <Card className="p-5" data-purpose="sms-by-project-chart">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">SMS by Project</h3>
        <span className="text-[11px] text-slate-400">Top {segments.length}</span>
      </div>

      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
          No submitted SMS yet.
        </div>
      ) : (
        <div className="h-[220px] flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {segments.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-3 space-y-2">
            {segments.map((s) => {
              const pct =
                totalSubmitted > 0
                  ? ((s.value / totalSubmitted) * 100).toFixed(0)
                  : '0';
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate text-slate-700 font-medium">
                      {s.name}
                    </span>
                  </div>
                  <span className="text-slate-500 shrink-0 ml-2">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}