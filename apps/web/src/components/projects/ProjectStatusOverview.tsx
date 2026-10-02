import { Card } from '../ui/Card';
import type { Project, ProjectStatus } from '@profjero/shared';

const SEGMENTS: Array<{
  key: ProjectStatus;
  label: string;
  barClass: string;
  dotClass: string;
}> = [
  { key: 'active', label: 'Active', barClass: 'bg-emerald-500', dotClass: 'bg-emerald-500' },
  { key: 'suspended', label: 'Suspended', barClass: 'bg-rose-500', dotClass: 'bg-rose-500' },
  { key: 'archived', label: 'Archived', barClass: 'bg-slate-400', dotClass: 'bg-slate-400' },
];

interface Props {
  projects: Project[];
}

export function ProjectStatusOverview({ projects }: Props) {
  const total = projects.length;

  const counts: Record<ProjectStatus, number> = {
    active: 0,
    suspended: 0,
    archived: 0,
  };
  for (const p of projects) counts[p.status] += 1;

  return (
    <Card className="p-4" data-purpose="status-overview-card">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h4 className="font-bold text-xs text-slate-900">
          Project Status Overview
        </h4>
      </div>

      {total === 0 ? (
        <div className="py-8 text-center text-[11px] text-slate-400">
          No projects yet.
        </div>
      ) : (
        <>
          {/* Stacked bar — segments only render if they have a count */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
            {SEGMENTS.map((s) => {
              const pct = (counts[s.key] / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={s.key}
                  className={s.barClass}
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${counts[s.key]}`}
                />
              );
            })}
          </div>

          {/* Legend with counts */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {SEGMENTS.map((s) => (
              <div key={s.key}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                  <span className={cnDot(s.dotClass)} />
                  {s.label}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {counts[s.key]}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            {total} project{total === 1 ? '' : 's'} total
          </div>
        </>
      )}
    </Card>
  );
}

function cnDot(cls: string) {
  return `w-2 h-2 rounded-full ${cls}`;
}