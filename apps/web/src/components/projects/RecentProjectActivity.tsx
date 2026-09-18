import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { recentProjectActivity } from '../../mock/projects';
import { cn } from '../../lib/utils';

const COLOR_MAP = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
} as const;

export function RecentProjectActivity() {
  return (
    <Card className="p-4" data-purpose="recent-activity-card">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h4 className="font-bold text-xs text-slate-900">Recent Project Activity</h4>
        <ViewAllLink />
      </div>
      <TableScroll>
        <table className="w-full text-left text-[11px]">
          <thead className="text-slate-400 border-b border-slate-100 font-medium">
            <tr>
              <th className="pb-2 whitespace-nowrap">Date &amp; Time</th>
              <th className="pb-2 whitespace-nowrap">Project</th>
              <th className="pb-2 whitespace-nowrap">Action</th>
              <th className="pb-2 whitespace-nowrap">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {recentProjectActivity.map((row, i) => (
              <tr key={i}>
                <td className="py-2.5 text-slate-400 whitespace-nowrap">{row.date}</td>
                <td className="py-2.5 font-medium text-blue-600 whitespace-nowrap">
                  {row.project}
                </td>
                <td className="py-2.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={cn('w-1.5 h-1.5 rounded-full', COLOR_MAP[row.actionColor])}
                    />
                    {row.action}
                  </span>
                </td>
                <td className="py-2.5 text-slate-500 whitespace-nowrap">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}