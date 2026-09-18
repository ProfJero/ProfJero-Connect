import { Search, ChevronDown } from 'lucide-react';

export function ProjectsFilterBar() {
  return (
    <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 justify-between bg-white">
      <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-0 placeholder:text-slate-400"
          placeholder="Search projects by name, client or sender ID..."
          type="text"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
        <button className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
          <span>All Status</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
          <span>All Clients</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1.5 text-left sm:text-center">
          Clear
        </button>
      </div>
    </div>
  );
}