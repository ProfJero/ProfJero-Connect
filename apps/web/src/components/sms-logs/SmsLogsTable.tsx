import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { smsLogs, totalLogCount, currentPageStart, currentPageEnd, totalPages } from '../../mock/smsLogs';
import { cn } from '../../lib/utils';

function SortableTh({ label, align = 'left' }: { label: string; align?: 'left' | 'center' }) {
  return (
    <th className={cn('py-3 px-3 whitespace-nowrap', align === 'center' && 'text-center')}>
      <div className={cn('flex items-center gap-1 cursor-pointer', align === 'center' && 'justify-center')}>
        {label} <span className="text-slate-400">⇅</span>
      </div>
    </th>
  );
}

export function SmsLogsTable() {
  return (
    <div
      className="flex-1 w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
      data-purpose="sms-logs-table-container"
    >
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
          SMS Logs{' '}
          <span className="text-slate-400 font-medium lowercase">
            ({totalLogCount.toLocaleString()})
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-3 w-8 text-center">#</th>
              <SortableTh label="Date & Time" />
              <SortableTh label="Project" />
              <SortableTh label="Sender ID" />
              <SortableTh label="Recipient" />
              <th className="py-3 px-3 whitespace-nowrap min-w-[200px]">
                <div className="flex items-center gap-1 cursor-pointer">
                  Message Preview <span className="text-slate-400">⇅</span>
                </div>
              </th>
              <SortableTh label="Units" align="center" />
              <SortableTh label="Status" />
              <SortableTh label="Provider Status" />
              <SortableTh label="Message ID" />
              <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {smsLogs.map((row, idx) => {
              const isSelected = idx === 0;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50',
                  )}
                >
                  <td className="py-3.5 px-3 text-center text-slate-500 font-medium">{row.id}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{row.date}</div>
                    <div className="text-[11px] text-slate-400">{row.time}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center',
                          row.projectAvatarBg,
                        )}
                      >
                        {row.project.charAt(0)}
                      </span>
                      <span className="font-medium">{row.project}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-medium whitespace-nowrap text-slate-600">{row.senderId}</td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">{row.recipient}</td>
                  <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">{row.messagePreview}</td>
                  <td className="py-3.5 px-2 text-center font-semibold text-slate-700">{row.units}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={row.providerStatus} />
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{row.messageId}</td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      aria-label="More options"
                      className="text-slate-400 hover:text-slate-600 font-bold tracking-wider"
                      type="button"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800">
            {currentPageStart} - {currentPageEnd}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-800">{totalLogCount.toLocaleString()}</span>{' '}
          messages
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous page"
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-400"
            type="button"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white font-bold" type="button">
            1
          </button>
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              type="button"
            >
              {n}
            </button>
          ))}
          <span className="px-1 text-slate-400">...</span>
          <button
            className="px-2 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
            type="button"
          >
            {totalPages.toLocaleString()}
          </button>
          <button
            aria-label="Next page"
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
            type="button"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}