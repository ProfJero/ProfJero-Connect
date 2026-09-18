import { Search, Calendar, Download } from 'lucide-react';

export function PaymentsFilterBar() {
  return (
    <div className="p-4 border-b border-slate-100 space-y-3">
      <h3 className="font-bold text-slate-800 text-sm">Payments</h3>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-64 max-w-full">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={2}
            />
            <input
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by reference, project or transaction..."
              type="text"
            />
          </div>

          <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100">
            <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
            <span>Sep 15, 2025 - Sep 21, 2025</span>
          </button>

          <select className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg pr-7 text-xs focus:ring-1 focus:ring-blue-500">
            <option>All Projects</option>
            <option>GABS</option>
            <option>DBI</option>
            <option>Church A</option>
            <option>Pharmacy</option>
            <option>School</option>
          </select>

          <select className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg pr-7 text-xs focus:ring-1 focus:ring-blue-500">
            <option>All Statuses</option>
            <option>Successful</option>
            <option>Pending</option>
            <option>Failed</option>
            <option>Refunded</option>
          </select>

          <select className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg pr-7 text-xs focus:ring-1 focus:ring-blue-500">
            <option>All Methods</option>
            <option>Mobile Money</option>
            <option>Card</option>
            <option>Bank Transfer</option>
          </select>
        </div>

        <button className="flex items-center gap-1.5 bg-[#1976d2] hover:bg-blue-600 text-white font-medium px-3.5 py-1.5 rounded-lg transition shadow-xs">
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}