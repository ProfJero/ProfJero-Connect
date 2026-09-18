import { Card } from '../ui/Card';
import { recentApiErrors } from '../../mock/arkesel';

export function RecentApiErrors() {
  return (
    <Card className="p-5" data-purpose="recent-api-errors">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Recent API Errors</h3>
        <a className="text-[11px] font-semibold text-blue-600 hover:underline" href="#">
          View All →
        </a>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="text-slate-400 font-semibold border-b border-slate-100">
              <th className="py-2">Date/Time</th>
              <th className="py-2 px-2">Error</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
            {recentApiErrors.map((row, i) => (
              <tr key={i}>
                <td className="py-2.5 text-slate-500 whitespace-nowrap">{row.date}</td>
                <td className="py-2.5 px-2 text-slate-700">{row.error}</td>
                <td className="py-2.5 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-semibold border border-rose-200">
                    Failed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}