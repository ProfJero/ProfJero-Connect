import { Search, Plus, MoreVertical } from 'lucide-react';
import { Card } from '../ui/Card';
import { walletRows } from '../../mock/wallets';
import { cn } from '../../lib/utils';

export function ProjectsWalletsTable() {
  return (
    <Card className="flex flex-col" data-purpose="projects-wallets-card">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Projects Wallets</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[150px]">
            <input
              className="w-full pl-7 pr-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search projects..."
              type="text"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" strokeWidth={2} />
          </div>

          <select className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <select className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none">
            <option>All Projects</option>
            <option>GABS</option>
            <option>DBI</option>
            <option>Church A</option>
            <option>Pharmacy</option>
            <option>School</option>
          </select>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg text-xs flex items-center gap-1 transition shadow-xs">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Add Units</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
              <th className="py-2.5 px-4 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-3 font-semibold text-right">Current Units</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units Purchased</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units Used</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units Refunded</th>
              <th className="py-2.5 px-3 font-semibold">Last Transaction</th>
              <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              <th className="py-2.5 px-3 font-semibold text-center">Low Balance</th>
              <th className="py-2.5 px-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {walletRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 text-slate-400 font-medium">{row.id}.</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0',
                        row.avatarBg,
                      )}
                    >
                      {row.project.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{row.project}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800">
                  {row.currentUnits}
                </td>
                <td className="py-3 px-3 text-right text-slate-500">{row.unitsPurchased}</td>
                <td className="py-3 px-3 text-right text-slate-500">{row.unitsUsed}</td>
                <td className="py-3 px-3 text-right text-slate-500">{row.unitsRefunded}</td>
                <td className="py-3 px-3 text-[11px] text-slate-500 leading-tight">
                  <div>{row.lastTransactionDate}</div>
                  <div className="text-slate-400 text-[10px]">{row.lastTransactionTime}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {row.lowBalance ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      No
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}