import { ArrowDownToLine, MoreVertical, ArrowUpDown } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import {
  recentMessages,
  messagingPagination,
  type MessageStatus,
} from '../../mock/messaging';
import { cn } from '../../lib/utils';

const STATUS_STYLES: Record<
  MessageStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  Completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  Submitted: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  Partial: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  Failed: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    dot: 'bg-rose-500',
  },
};

function SortableTh({ label, align = 'left' }: { label: string; align?: 'left' | 'right' }) {
  return (
    <th
      className={cn(
        'py-3 px-4 whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-200',
        align === 'right' && 'text-right',
      )}
      scope="col"
    >
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'right' && 'justify-end',
        )}
      >
        <span>{label}</span>
        <ArrowUpDown className="w-3 h-3 text-slate-400" strokeWidth={2} />
      </div>
    </th>
  );
}

export function RecentMessagesTable() {
  const p = messagingPagination;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Messages</h3>
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
          <ArrowDownToLine className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Export</span>
        </button>
      </div>

      <TableScroll>
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800 tracking-wider">
            <tr>
              <SortableTh label="Date & Time" />
              <SortableTh label="Sender ID" />
              <SortableTh label="Recipients" />
              <th className="py-3 px-4 whitespace-nowrap min-w-[280px]">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                  <span>Message</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" strokeWidth={2} />
                </div>
              </th>
              <SortableTh label="Units" />
              <SortableTh label="Status" />
              <th className="py-3 px-4 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentMessages.map((row) => {
              const s = STATUS_STYLES[row.status];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5 font-normal text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {row.senderId}
                  </td>
                  <td className="py-3.5 px-4 font-normal text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.recipients.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-normal text-slate-600 dark:text-slate-400 max-w-sm truncate">
                    {row.messagePreview}
                  </td>
                  <td className="py-3.5 px-4 font-normal text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.units.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                        s.bg,
                        s.text,
                        s.border,
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                      <span>{row.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    <button className="hover:text-slate-700 dark:hover:text-slate-300 p-1">
                      <MoreVertical className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{p.from} - {p.to}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{p.total}</span> messages
        </p>
        <nav aria-label="Pagination" className="inline-flex items-center gap-1">
          <PageButton>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
          <PageButton active>1</PageButton>
          {[2, 3, 4, 5].map((n) => (
            <PageButton key={n} className="hidden sm:flex">
              {n}
            </PageButton>
          ))}
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 px-1">...</span>
          <PageButton className="hidden sm:flex">{p.lastPage}</PageButton>
          <PageButton>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PageButton>
        </nav>
      </div>
    </section>
  );
}

function PageButton({
  children,
  active = false,
  className = '',
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors',
        active
          ? 'bg-[#1a6cf0] text-white font-semibold shadow-xs'
          : 'border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium',
        className,
      )}
    >
      {children}
    </button>
  );
}