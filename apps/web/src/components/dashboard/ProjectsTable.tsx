import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import type { DashboardResponse } from '@profjero/shared';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-sky-600',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-purple-600',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  topProjects: DashboardResponse['topProjects'];
  onProjectClick?: (projectId: string) => void;
}

export function ProjectsTable({ topProjects, onProjectClick }: Props) {
  return (
    <Card className="overflow-hidden" data-purpose="top-projects-table">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">
          Top Projects by SMS Activity
        </h3>
        <ViewAllLink href="/projects" />
      </div>

      <TableScroll>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200/70">
            <tr>
              <th className="py-2.5 px-4">Project</th>
              <th className="py-2.5 px-3 text-right">Submitted</th>
              <th className="py-2.5 px-3 text-right">Failed</th>
              <th className="py-2.5 px-3 text-right">Units Charged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {topProjects.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">
                  No SMS activity yet.
                </td>
              </tr>
            )}
            {topProjects.map((p) => (
              <tr
                key={p.projectId}
                onClick={() => onProjectClick?.(p.projectId)}
                className={cn(
                  'transition-colors',
                  onProjectClick && 'cursor-pointer hover:bg-slate-50/70',
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0',
                        avatarColor(p.projectId),
                      )}
                    >
                      {p.projectName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900 truncate">
                      {p.projectName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-medium text-emerald-600">
                  {p.submitted.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-medium text-rose-600">
                  {p.failed > 0 ? p.failed.toLocaleString() : '—'}
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800">
                  {p.charged.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}