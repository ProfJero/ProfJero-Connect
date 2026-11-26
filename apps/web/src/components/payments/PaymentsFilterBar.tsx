import { Search, Plus, ChevronDown } from 'lucide-react';
import type { PaymentStatus, ProjectListResponse } from '@profjero/shared';

export interface PaymentsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: PaymentStatus | 'all';
  onStatusChange: (v: PaymentStatus | 'all') => void;
  projectId: string | 'all';
  onProjectChange: (v: string | 'all') => void;
  projects: ProjectListResponse['projects'];
  onClear: () => void;
  onInitiate: () => void;
}

const STATUS_OPTIONS: Array<{ value: PaymentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'refunded', label: 'Refunded' },
];

export function PaymentsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  projectId,
  onProjectChange,
  projects,
  onClear,
  onInitiate,
}: PaymentsFilterBarProps) {
  const hasFilters =
    search.length > 0 || status !== 'all' || projectId !== 'all';

  return (
    <div className="p-4 border-b border-slate-100 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-800 text-sm">Payments</h3>
        <button
          type="button"
          onClick={onInitiate}
          className="flex items-center gap-1.5 bg-[#1976d2] hover:bg-blue-600 text-white font-medium px-3.5 py-1.5 rounded-lg transition shadow-xs text-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Initiate Payment</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="relative w-64 max-w-full">
          <Search
            className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by reference or email..."
            type="text"
          />
        </div>

        <div className="relative">
          <select aria-label="Filter by project"
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 pl-3 pr-8 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select aria-label="Filter by status"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as PaymentStatus | 'all')
            }
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 pl-3 pr-8 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1.5 disabled:text-slate-300 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}