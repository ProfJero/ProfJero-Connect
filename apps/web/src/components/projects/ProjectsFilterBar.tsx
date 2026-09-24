import { Search, ChevronDown } from 'lucide-react';
import type { ProjectStatus } from '@profjero/shared';

export type SortOption = 'name-asc' | 'updated-desc' | 'updated-asc';

export interface ProjectsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: ProjectStatus | 'all';
  onStatusChange: (v: ProjectStatus | 'all') => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  onClear: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name (A–Z)',
  'updated-desc': 'Last Updated (newest)',
  'updated-asc': 'Last Updated (oldest)',
};

export function ProjectsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onClear,
}: ProjectsFilterBarProps) {
  const hasAnyFilter = search.length > 0 || status !== 'all';

  return (
    <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 justify-between bg-white">
      <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-0 placeholder:text-slate-400"
          placeholder="Search by name, description or contact email..."
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
        <SelectControl
          value={status}
          onChange={(v) => onStatusChange(v as ProjectStatus | 'all')}
          display={
            status === 'all'
              ? 'All Status'
              : status.charAt(0).toUpperCase() + status.slice(1)
          }
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'archived', label: 'Archived' },
          ]}
        />

        <SelectControl
          value={sort}
          onChange={(v) => onSortChange(v as SortOption)}
          display={SORT_LABELS[sort]}
          options={(Object.keys(SORT_LABELS) as SortOption[]).map((k) => ({
            value: k,
            label: SORT_LABELS[k],
          }))}
        />

        <button
          onClick={onClear}
          disabled={!hasAnyFilter}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1.5 text-left sm:text-center disabled:text-slate-300 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// --- Native select styled to look like the old button. Accessible, keyboard-
// navigable, mobile-friendly. No custom dropdown code needed. ---
function SelectControl({
  value,
  onChange,
  display,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  display: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-600 border border-slate-200 rounded-lg pl-3 pr-8 py-2 hover:bg-slate-50 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
      {/* The visible label comes from the <select>'s own rendering when closed.
          We pass `display` only as a fallback concept; native <select> already
          shows the matching option's label. */}
      <span className="sr-only">{display}</span>
    </div>
  );
}