// apps/web/src/components/dashboard/RecentBatches.tsx (new)
import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { DashboardResponse } from '@profjero/shared';

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  submitting: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface Props {
  batches: DashboardResponse['recentBatches'];
}

export function RecentBatches({ batches }: Props) {
  return (
    <Card className="overflow-hidden" data-purpose="recent-batches">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Recent Batches</h3>
        <ViewAllLink label="View all" href="/sms-logs" />
      </div>

      <TableScroll>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200/70">
            <tr>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-3">Project</th>
              <th className="py-2.5 px-3 text-center">Recipients</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {batches.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500 text-sm">
                  No batches yet.
                </td>
              </tr>
            )}
            {batches.map((b) => {
              const { date, time } = splitDateTime(b.createdAt);
              const short = `${date.split(',')[0]} ${time}`;
              return (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                    {short}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 truncate">
                    {b.projectName}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700">
                    {b.totalRecipients}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        STATUS_STYLES[b.status] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                      )}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}