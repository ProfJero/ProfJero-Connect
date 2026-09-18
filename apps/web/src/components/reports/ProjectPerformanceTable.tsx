import { Card } from '../ui/Card';
import { projectPerformance } from '../../mock/reports';
import { cn } from '../../lib/utils';

export function ProjectPerformanceTable() {
  return (
    <Card className="p-5 lg:col-span-4 flex flex-col" data-purpose="project-performance">
      <h3 className="text-sm font-bold text-slate-900">Project Performance</h3>
      <p className="text-xs text-slate-400 mb-3">Compare projects by key metrics.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium text-right">SMS Volume</th>
              <th className="pb-2 font-medium text-right">Units Used</th>
              <th className="pb-2 font-medium text-right">Revenue</th>
              <th className="pb-2 font-medium text-right">Growth</th>
              <th className="pb-2 font-medium text-right">Failure Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projectPerformance.map((row) => (
              <tr key={row.name} className="hover:bg-slate-50">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        row.avatarBg,
                      )}
                    >
                      {row.name.charAt(0)}
                    </span>
                    <span className="font-medium text-slate-800">{row.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium text-slate-700">{row.smsVolume}</td>
                <td className="py-2.5 text-right text-slate-500">{row.unitsUsed}</td>
                <td className="py-2.5 text-right font-medium text-slate-700">{row.revenue}</td>
                <td className="py-2.5 text-right font-semibold text-emerald-600">
                  ↑ {row.growth}
                </td>
                <td className="py-2.5 text-right text-slate-600">{row.failureRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}