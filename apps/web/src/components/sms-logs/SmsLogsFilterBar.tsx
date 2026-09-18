import { Search, Calendar, ChevronDown, Filter, User } from 'lucide-react';

export function SmsLogsFilterBar() {
  return (
    <section
      className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3"
      data-purpose="filter-bar"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by recipient, message ID, or content..."
            type="text"
          />
        </div>

        <div className="md:col-span-3">
          <button
            className="w-full flex items-center justify-between text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            type="button"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <span>Sep 15, 2025 - Sep 21, 2025</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
          </button>
        </div>

        <div className="md:col-span-2">
          <select className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Projects</option>
            <option>GABS</option>
            <option>DBI</option>
            <option>Church A</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Sender IDs</option>
            <option>GABS</option>
            <option>DBI</option>
            <option>CHURCH</option>
            <option>EDPHARMACY</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="w-40">
          <select className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Statuses</option>
            <option>Sent</option>
            <option>Delivered</option>
            <option>Failed</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="w-44">
          <select className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Message Types</option>
            <option>Transactional</option>
            <option>Promotional</option>
            <option>OTP</option>
          </select>
        </div>

        <div className="w-64 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <User className="w-4 h-4" strokeWidth={1.8} />
          </span>
          <input
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search recipient (e.g. 0244...)"
            type="text"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2" type="button">
            Clear Filters
          </button>
          <button
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            type="button"
          >
            <Filter className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </section>
  );
}