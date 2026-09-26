import { Search, Calendar, ChevronDown } from 'lucide-react';
import { senderIdFilterOptions } from '../../mock/messaging';

export function MessagingFilterBar() {
  return (
    <section className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[240px] relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        <input
          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] transition"
          placeholder="Search by recipient, message, or reference..."
          type="text"
        />
      </div>

      <FilterButton
        icon={<Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />}
        label="Sep 15, 2025 - Sep 21, 2025"
        chevron
      />

      <SimpleFilter label="All Projects" />

      <select
        className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] transition cursor-pointer"
        defaultValue={senderIdFilterOptions[0]}
      >
        {senderIdFilterOptions.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>

      <SimpleFilter label="All Statuses" />

      <button className="text-xs text-[#1a6cf0] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 transition-colors">
        Clear
      </button>
    </section>
  );
}

function FilterButton({
  icon,
  label,
  chevron,
}: {
  icon?: React.ReactNode;
  label: string;
  chevron?: boolean;
}) {
  return (
    <button className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
      {icon}
      <span>{label}</span>
      {chevron && <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={2} />}
    </button>
  );
}

function SimpleFilter({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
      <span>{label}</span>
      <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={2} />
    </button>
  );
}