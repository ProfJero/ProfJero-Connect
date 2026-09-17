import { Plus, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, ViewAllLink } from '../ui/Card';
import { StatusDot } from '../ui/StatusDot';
import { projects } from '../../mock/dashboard';

export function ProjectsTable() {
  return (
    <Card className="overflow-hidden" data-purpose="platforms-table">
      <CardHeader>
        <CardTitle>Your Platforms / Projects</CardTitle>
        <div className="flex items-center gap-4">
          <ViewAllLink />
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50 font-semibold">
              <th className="py-3 px-4 font-semibold">#</th>
              <th className="py-3 px-4 font-semibold">Project Name</th>
              <th className="py-3 px-4 font-semibold">Sender ID</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Units</th>
              <th className="py-3 px-4 font-semibold">SMS Sent</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 text-slate-400">{p.id}</td>
                <td className="py-3.5 px-4 flex items-center gap-2.5 font-bold text-slate-800">
                  <span
                    className={`w-6 h-6 rounded-full ${p.avatarBg} text-white flex items-center justify-center text-[11px] font-bold`}
                  >
                    {p.name.charAt(0)}
                  </span>
                  {p.name}
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.senderId}</td>
                <td className="py-3.5 px-4">
                  <StatusDot status={p.status} />
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">{p.units}</td>
                <td className="py-3.5 px-4 text-slate-600">{p.smsSent}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600">
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