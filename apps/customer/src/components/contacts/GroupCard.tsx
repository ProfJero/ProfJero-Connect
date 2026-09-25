import { MoreVertical, Calendar } from 'lucide-react';
import type { ContactGroupCard } from '../../mock/contactGroups';
import { cn } from '../../lib/utils';

export function GroupCard({ group }: { group: ContactGroupCard }) {
  const Icon = group.icon;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', group.iconBg, group.iconColor)}>
              <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                {group.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {group.contactCount} contacts
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {group.status}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-4 font-normal">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={2} />
          Last updated: {group.lastUpdated}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
          {group.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
        <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
          View Contacts
        </button>
        <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <MoreVertical className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}