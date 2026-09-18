import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { projectEvents, type ProjectEventRow } from '../../mock/projectDetails';
import { cn } from '../../lib/utils';

const STATUS_STYLES: Record<ProjectEventRow['status'], { bg: string; text: string; dot: string }> = {
  Success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Info: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
};

export function ProjectEventsCard() {
  return (
    <Card className="p-4 lg:col-span-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-900 text-sm">Project Events</h4>
        <ViewAllLink />
      </div>

      <TableScroll>
        <table className="w-full text-left text-[11px] mt-2">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 font-medium">
              <th className="py-2 font-medium whitespace-nowrap">Date &amp; Time</th>
              <th className="py-2 font-medium whitespace-nowrap">Event</th>
              <th className="py-2 font-medium">Details</th>
              <th className="py-2 font-medium text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {projectEvents.map((row, i) => {
              const s = STATUS_STYLES[row.status];
              return (
                <tr key={i}>
                  <td className="py-2.5 text-slate-500 whitespace-nowrap">{row.date}</td>
                  <td className="py-2.5 font-medium text-blue-600 whitespace-nowrap">{row.event}</td>
                  <td className="py-2.5 text-slate-600">{row.details}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full',
                        s.bg,
                        s.text,
                      )}
                    >
                      <span className={cn('w-1 h-1 rounded-full', s.dot)} />
                      {row.status}
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