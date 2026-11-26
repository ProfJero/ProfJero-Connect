import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { Project } from '@profjero/shared';

const STATUS_BADGE: Record<
  Project['status'],
  { label: string; class: string }
> = {
  active: {
    label: 'Active',
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  suspended: {
    label: 'Suspended',
    class: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  archived: {
    label: 'Archived',
    class: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

interface Props {
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
}

export function RecentProjectActivity({ projects, onProjectClick }: Props) {
  // Sort by updatedAt desc, take 5. ISO 8601 strings sort chronologically as
  // plain strings as long as timezones are consistent (Firestore returns UTC).
  const recent = [...projects]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <Card className="p-4" data-purpose="recent-activity-card">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h4 className="font-bold text-xs text-slate-900">
          Recent Project Activity
        </h4>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-[11px] text-slate-500">
          No activity yet.
        </div>
      ) : (
        <TableScroll>
          <table className="w-full text-left text-[11px]">
            <thead className="text-slate-500 border-b border-slate-100 font-medium">
              <tr>
                <th className="pb-2 whitespace-nowrap">Date &amp; Time</th>
                <th className="pb-2 whitespace-nowrap">Project</th>
                <th className="pb-2 whitespace-nowrap">Action</th>
                <th className="pb-2 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {recent.map((p) => {
                const { date, time } = splitDateTime(p.updatedAt);
                // We only know a project was created vs updated by comparing
                // the two timestamps — they're identical right after creation.
                // Not as rich as an audit log; honest for what we have today.
                const isCreation = p.createdAt === p.updatedAt;
                const status = STATUS_BADGE[p.status];
                return (
                  <tr key={p.id}>
                    <td className="py-2.5 text-slate-500 whitespace-nowrap">
                      {date} {time}
                    </td>
                    <td className="py-2.5 font-medium text-blue-600 whitespace-nowrap">
                      {onProjectClick ? (
                        <button
                          onClick={() => onProjectClick(p.id)}
                          className="hover:underline"
                        >
                          {p.name}
                        </button>
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isCreation ? 'bg-blue-500' : 'bg-emerald-500',
                          )}
                        />
                        {isCreation ? 'Created' : 'Updated'}
                      </span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          status.class,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Card>
  );
}