import { Card, ViewAllLink } from '../ui/Card';
import { topProjectsByUsage } from '../../mock/projects';
import { cn } from '../../lib/utils';

export function TopProjectsByUsage() {
  return (
    <Card className="p-4" data-purpose="top-usage-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-xs text-slate-900">Top Projects by Usage</h4>
        <ViewAllLink />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-slate-400 border-b border-slate-100 font-medium">
            <tr>
              <th className="pb-2">Project</th>
              <th className="pb-2">SMS Sent</th>
              <th className="pb-2">Units Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {topProjectsByUsage.map((row) => (
              <tr key={row.name}>
                <td className="py-2.5 font-medium flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold',
                      row.avatarBg,
                    )}
                  >
                    {row.name.charAt(0)}
                  </span>
                  <span>{row.name}</span>
                </td>
                <td className="py-2.5">{row.smsSent}</td>
                <td className="py-2.5">
                  <div className="flex flex-col gap-1 w-28">
                    <span className="font-medium">{row.unitsUsed}</span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${row.unitsBarPct}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}