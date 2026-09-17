import { Building, Plus } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProjectsTable } from './ProjectsTable';
import { RecentProjectActivity } from './RecentProjectActivity';
import { TopProjectsByUsage } from './TopProjectsByUsage';
import { ProjectDetailsPanel } from './ProjectDetailsPanel';
import { projectMetrics } from '../../mock/projects';

export function ProjectsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Page title bar */}
      <div className="flex items-center justify-between" data-purpose="page-title-banner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Projects / Clients
            </h2>
            <p className="text-xs text-slate-500">
              Manage all your projects, clients and their SMS integration details.
            </p>
          </div>
        </div>
        <button className="bg-[#1976d2] hover:bg-blue-600 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition">
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {projectMetrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* Main grid: content left, details right */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <ProjectsTable />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentProjectActivity />
            <TopProjectsByUsage />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ProjectDetailsPanel />
        </div>
      </div>
    </main>
  );
}