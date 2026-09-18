import { Card, CardHeader, CardTitle, ViewAllLink } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { TableScroll } from '../ui/TableScroll';
import { recentSmsLogs } from '../../mock/dashboard';

export function RecentSmsLogs() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 flex-wrap gap-2">
        <CardTitle>Recent SMS Logs</CardTitle>
        <ViewAllLink />
      </CardHeader>
      <TableScroll>
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
              <th className="py-2.5 px-3 font-semibold">Platform</th>
              <th className="py-2.5 px-3 font-semibold">Recipient</th>
              <th className="py-2.5 px-3 font-semibold">Units</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentSmsLogs.map((row, i) => (
              <tr key={i}>
                <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{row.date}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                  {row.platform}
                </td>
                <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{row.recipient}</td>
                <td className="py-2.5 px-3 text-slate-600">{row.units}</td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}