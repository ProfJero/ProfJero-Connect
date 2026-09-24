import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import {
  formatGhs,
  type ProjectStat,
} from '../../lib/reportAggregation';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-teal-100 text-teal-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  stats: ProjectStat[];
}

export function ProjectPerformanceTable({ stats }: Props) {
  const rows = stats.slice(0, 5);

  return (
    <Card className="p-5 lg:col-span-4 flex flex-col" data-purpose="project-performance">
      <h3 className="text-sm font-bold text-slate-900">Project Performance</h3>
      <p className="text-xs text-slate-400 mb-3">Top projects by SMS volume.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium text-right">SMS</th>
              <th className="pb-2 font-medium text-right">Units</th>
              <th className="pb-2 font-medium text-right">Revenue</th>
              <th className="pb-2 font-medium text-right">Fail %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No project activity in this period.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.projectId} className="hover:bg-slate-50">
                <td className="py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                        avatarColor(row.projectId),
                      )}
                    >
                      {row.projectName.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-800 truncate">
                      {row.projectName}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium text-slate-700">
                  {row.recipients.toLocaleString()}
                </td>
                <td className="py-2.5 text-right text-slate-500">
                  {row.units.toLocaleString()}
                </td>
                <td className="py-2.5 text-right font-medium text-slate-700 whitespace-nowrap">
                  {row.revenuePesewas > 0 ? formatGhs(row.revenuePesewas) : '—'}
                </td>
                <td className="py-2.5 text-right text-slate-600">
                  {row.totalOutcomes > 0
                    ? `${(row.failureRate * 100).toFixed(1)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}