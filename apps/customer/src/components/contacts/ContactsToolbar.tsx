import { Search, Users, Filter, CircleCheck } from 'lucide-react';

export function ContactsToolbar() {
  return (
    <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-lg">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" strokeWidth={2} />
        </span>
        <input
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
          placeholder="Search contacts by name or phone number..."
          type="text"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToolbarButton icon={Users} label="All Groups" />
        <ToolbarButton icon={Filter} label="Status" />
        <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1a6cf0] dark:text-blue-400 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors">
          <CircleCheck className="w-4 h-4" strokeWidth={2} />
          <span>Bulk Actions</span>
          <ChevronDown />
        </button>
      </div>
    </section>
  );
}

function ToolbarButton({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium shadow-xs transition-colors">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={2} />
      <span>{label}</span>
      <ChevronDown />
    </button>
  );
}

function ChevronDown() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}