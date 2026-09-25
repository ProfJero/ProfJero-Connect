import { useState } from 'react';
import { Eye, Pencil, MoreVertical } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import { contacts, contactsPagination, GROUP_TONE } from '../../mock/contacts';
import { cn } from '../../lib/utils';

export function ContactsTable() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const allSelected = selected.size === contacts.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const p = contactsPagination;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Selection bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={toggleAll}
          className="w-4 h-4 rounded border-slate-300 text-[#1a6cf0] focus:ring-[#1a6cf0]/20"
        />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {selected.size} selected
        </span>
      </div>

      {/* Table */}
      <TableScroll>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-wider">
              <th className="pl-6 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#1a6cf0] focus:ring-[#1a6cf0]/20"
                />
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">Name</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Phone</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Group</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Date Added</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
              <th className="pr-6 py-3.5 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {contacts.map((row) => {
              const groupStyle = GROUP_TONE[row.group];
              const isSelected = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-500/10'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50',
                  )}
                >
                  <td className="pl-6 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(row.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#1a6cf0] focus:ring-[#1a6cf0]/20"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0',
                          row.avatarBg,
                        )}
                      >
                        {row.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                          {row.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {row.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                        groupStyle.bg,
                        groupStyle.text,
                        groupStyle.border,
                      )}
                    >
                      {row.group}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.dateAdded}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="pr-6 py-3.5">
                    <div className="flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                      <button className="hover:text-[#1a6cf0] dark:hover:text-blue-400 transition-colors" title="View">
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button className="hover:text-[#1a6cf0] dark:hover:text-blue-400 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="More">
                        <MoreVertical className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-800 dark:text-slate-100">{p.from} - {p.to}</span> of{' '}
          <span className="font-bold text-slate-800 dark:text-slate-100">{p.total.toLocaleString()}</span> contacts
        </p>
        <div className="flex items-center gap-1.5">
          <PageButton disabled>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
          <PageButton active>1</PageButton>
          {[2, 3, 4, 5].map((n) => (
            <PageButton key={n} className="hidden sm:flex">
              {n}
            </PageButton>
          ))}
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 text-xs font-medium tracking-widest px-1">
            ...
          </span>
          <PageButton className="hidden sm:flex">{p.lastPage}</PageButton>
          <PageButton>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  children,
  active = false,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors disabled:opacity-40',
        active
          ? 'bg-[#1a6cf0] text-white font-bold shadow-xs'
          : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium',
        className,
      )}
    >
      {children}
    </button>
  );
}