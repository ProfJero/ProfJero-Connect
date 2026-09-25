import { Plus, Download, UsersRound } from 'lucide-react';
import { ContactsStats } from '../../components/contacts/ContactsStats';
import { ContactsToolbar } from '../../components/contacts/ContactsToolbar';
import { ContactsTable } from '../../components/contacts/ContactsTable';
import { Users } from 'lucide-react';

export function ContactsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      {/* Page header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100/70 dark:bg-blue-500/20 text-[#1a6cf0] dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Contacts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage the people and customers you communicate with.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Contact</span>
          </button>
          <button className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <Download className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
            <span>Import Contacts</span>
          </button>
          <button className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <UsersRound className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
            <span>Create Group</span>
          </button>
        </div>
      </section>

      <ContactsStats />
      <ContactsToolbar />
      <ContactsTable />
    </main>
  );
}