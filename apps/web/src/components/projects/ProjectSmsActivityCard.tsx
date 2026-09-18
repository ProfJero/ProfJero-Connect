import { Card, ViewAllLink } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { StatusBadge } from '../ui/StatusBadge';
import { smsActivity } from '../../mock/projectDetails';

export function ProjectSmsActivityCard() {
  return (
    <Card className="p-4 lg:col-span-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-900 text-sm">SMS Activity</h4>
        <ViewAllLink />
      </div>

      <TableScroll>
        <table className="w-full text-left text-[11px] mt-2">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 font-medium">
              <th className="py-2 font-medium whitespace-nowrap">Date &amp; Time</th>
              <th className="py-2 font-medium whitespace-nowrap">Recipient</th>
              <th className="py-2 font-medium">Message</th>
              <th className="py-2 font-medium whitespace-nowrap">Status</th>
              <th className="py-2 font-medium text-right whitespace-nowrap">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {smsActivity.map((row, i) => (
              <tr key={i}>
                <td className="py-2.5 text-slate-500 whitespace-nowrap">{row.date}</td>
                <td className="py-2.5 font-mono text-slate-700 font-medium whitespace-nowrap">
                  {row.recipient}
                </td>
                <td className="py-2.5 text-slate-600 max-w-[130px] truncate">{row.preview}</td>
                <td className="py-2.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-2.5 text-right font-medium">{row.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}