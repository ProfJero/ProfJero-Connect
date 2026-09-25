import { Plus, UsersRound, Search, Users, ArrowUpDown } from 'lucide-react';
import { GroupCard } from '../../components/contacts/GroupCard';
import { contactGroups } from '../../mock/contactGroups';

export function ContactGroupsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      {/* Page header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] flex items-center justify-center shadow-xs shrink-0">
            <Users className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Contact Groups
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Organise your contacts into groups for easier and more effective communication.
            </p>
          </div>
        </div>

        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-sm font-semibold rounded-lg shadow-xs transition-all active:scale-95 shrink-0">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Create Group</span>
        </button>
      </section>

      {/* Search + filters */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-5/12">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] shadow-xs placeholder-slate-400 dark:placeholder:text-slate-500"
            placeholder="Search groups..."
            type="text"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none inline-flex items-center justify-between gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors">
            <span className="flex items-center gap-2">
              <UsersRound className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2} />
              <span className="text-slate-600 dark:text-slate-300">All Groups</span>
            </span>
            <ChevronDown />
          </button>
          <button className="flex-1 md:flex-none inline-flex items-center justify-between gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2} />
              <span className="text-slate-600 dark:text-slate-300">
                Sort by: <span className="text-slate-900 dark:text-slate-100 font-semibold">Last Updated</span>
              </span>
            </span>
            <ChevronDown />
          </button>
        </div>
      </section>

      {/* Groups grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contactGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </section>
    </main>
  );
}

function ChevronDown() {
  return (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}