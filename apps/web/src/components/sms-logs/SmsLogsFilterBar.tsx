import { Search, ChevronDown } from 'lucide-react';
import type {
  SmsBatchStatus,
  ProjectListResponse,
} from '@profjero/shared';

export interface SmsLogsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: SmsBatchStatus | 'all';
  onStatusChange: (v: SmsBatchStatus | 'all') => void;
  projectId: string | 'all';
  onProjectChange: (v: string | 'all') => void;
  projects: ProjectListResponse['projects'];
  onClear: () => void;
}

const STATUS_OPTIONS: Array<{ value: SmsBatchStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'submitting', label: 'Submitting' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'partial', label: 'Partial' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export function SmsLogsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  projectId,
  onProjectChange,
  projects,
  onClear,
}: SmsLogsFilterBarProps) {
  const hasFilters = search.length > 0 || status !== 'all' || projectId !== 'all';

  return (
    <section
      className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs"
      data-purpose="filter-bar"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="md:flex-1 relative min-w-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by batch ID or message content..."
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative sm:w-40">
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as SmsBatchStatus | 'all')
              }
              className="appearance-none w-full text-xs pl-3 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative sm:w-56">
            <select
              value={projectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="appearance-none w-full text-xs pl-3 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={onClear}
            disabled={!hasFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1.5 disabled:text-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}