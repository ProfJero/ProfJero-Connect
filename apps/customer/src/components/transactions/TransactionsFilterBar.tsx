import { Search, Calendar, ChevronDown } from 'lucide-react';
import {
  dateFilterOptions,
  typeFilterOptions,
  serviceFilterOptions,
  statusFilterOptions,
} from '../../mock/transactions';

export function TransactionsFilterBar() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Search */}
      <div className="md:col-span-4 relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" strokeWidth={2} />
        </span>
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all shadow-xs"
          placeholder="Search transactions..."
          type="text"
        />
      </div>

      {/* Date */}
      <div className="md:col-span-2 relative">
        <button className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-left shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 truncate">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
            <span className="truncate">{dateFilterOptions[1]}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" strokeWidth={2} />
        </button>
      </div>

      {/* Type */}
      <div className="md:col-span-2">
        <select
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 shadow-xs focus:outline-none cursor-pointer truncate"
          defaultValue={typeFilterOptions[0]}
        >
          {typeFilterOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Service */}
      <div className="md:col-span-2">
        <select
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 shadow-xs focus:outline-none cursor-pointer truncate"
          defaultValue={serviceFilterOptions[0]}
        >
          {serviceFilterOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="md:col-span-2">
        <select
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 shadow-xs focus:outline-none cursor-pointer truncate"
          defaultValue={statusFilterOptions[0]}
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </section>
  );
}