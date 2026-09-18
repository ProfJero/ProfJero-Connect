import { Plus, MoreVertical } from 'lucide-react';
import { Card } from '../ui/Card';
import { senderIds } from '../../mock/arkesel';
import { cn } from '../../lib/utils';

export function SenderIdsTable() {
  return (
    <Card className="p-5" data-purpose="sender-ids">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sender IDs</h2>
          <p className="text-xs text-slate-500">
            Manage your Arkesel sender IDs and their usage across projects.
          </p>
        </div>
        <button className="bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition shadow-xs">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Add Sender ID</span>
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-2 w-8">#</th>
              <th className="py-2.5 px-3">Sender ID</th>
              <th className="py-2.5 px-3">Assigned Project</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 w-40">Usage</th>
              <th className="py-2.5 px-3">Last Used</th>
              <th className="py-2.5 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {senderIds.map((row) => {
              const isLimited = row.status === 'Limited';
              return (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-2 text-slate-400">{row.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{row.value}</td>
                  <td className="py-3 px-3 text-slate-600">{row.project}</td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                        isLimited
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full mr-1.5',
                          isLimited ? 'bg-amber-500' : 'bg-emerald-500',
                        )}
                      />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-[11px] text-slate-500">{row.usagePct}%</span>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${row.usagePct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{row.lastUsed}</td>
                  <td className="py-3 px-2 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}