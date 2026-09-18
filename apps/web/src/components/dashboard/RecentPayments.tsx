import { Card, CardHeader, CardTitle, ViewAllLink } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { TableScroll } from '../ui/TableScroll';
import { recentPayments } from '../../mock/dashboard';

export function RecentPayments() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 flex-wrap gap-2">
        <CardTitle>Recent Payments</CardTitle>
        <ViewAllLink />
      </CardHeader>
      <TableScroll>
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="py-2.5 px-3 font-semibold">Ref. No.</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-3 font-semibold">Package</th>
              <th className="py-2.5 px-3 font-semibold">Amount</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentPayments.map((row) => (
              <tr key={row.ref}>
                <td className="py-2.5 px-3 font-medium text-blue-600 whitespace-nowrap">{row.ref}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                  {row.project}
                </td>
                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{row.package}</td>
                <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                  {row.amount}
                </td>
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