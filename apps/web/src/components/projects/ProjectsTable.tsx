import { MoreHorizontal } from 'lucide-react';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { ProjectsFilterBar } from './ProjectsFilterBar';
import { projects } from '../../mock/projects';
import { cn } from '../../lib/utils';

export function ProjectsTable() {
  return (
    <Card className="overflow-hidden" data-purpose="projects-table-section">
      <ProjectsFilterBar />

      <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-slate-800">Projects / Clients</h3>
      </div>

      <TableScroll>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-4 w-8">#</th>
              <th className="py-3 px-4 whitespace-nowrap">Project Name</th>
              <th className="py-3 px-4 whitespace-nowrap">Client / Organization</th>
              <th className="py-3 px-4 whitespace-nowrap">Sender ID</th>
              <th className="py-3 px-4 whitespace-nowrap">API Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Units</th>
              <th className="py-3 px-4 whitespace-nowrap">SMS Sent</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Last Activity</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {projects.map((p, idx) => {
              const isSelected = idx === 0;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/70',
                  )}
                >
                  <td className="py-3 px-4 font-medium text-slate-500">{p.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center',
                          p.avatarBg,
                        )}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{p.client}</td>
                  <td className="py-3 px-4 font-medium whitespace-nowrap">{p.senderId}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        p.apiStatus === 'Active' ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          p.apiStatus === 'Active' ? 'bg-emerald-500' : 'bg-rose-500',
                        )}
                      />
                      {p.apiStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{p.units}</td>
                  <td className="py-3 px-4">{p.smsSent}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        p.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-rose-100 text-rose-700 border-rose-200',
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    <div>{p.lastActivityDate}</div>
                    <div className="text-[10px]">{p.lastActivityTime}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    <button className="hover:text-slate-700 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
        <span>
          Showing 1 - {projects.length} of {projects.length} projects
        </span>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-400 disabled:opacity-50"
            disabled
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1976d2] text-white font-medium">
            1
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-400 disabled:opacity-50"
            disabled
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}