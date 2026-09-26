import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Info,
  Search,
  Filter,
  ArrowDownToLine,
  MoreVertical,
} from 'lucide-react';
import { TableScroll } from '../../components/ui/TableScroll';
import { SenderIdStatusBadge } from '../../components/sender-ids/SenderIdStatusBadge';
import {
  senderIds,
  senderIdsPagination,
  senderIdStatusOptions,
} from '../../mock/senderIds';

export function SenderIdsPage() {
  const p = senderIdsPagination;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Sender IDs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage the names used when sending messages.
            </p>
          </div>
        </div>

        <Link
          to="/messaging/sender-ids/request"
          className="bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center shadow-xs shadow-blue-500/30 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
          Request Sender ID
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
        <div className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">
            Sender ID requests are reviewed before activation.
          </p>
          <p>
            <strong className="font-semibold text-slate-700 dark:text-slate-200">
              Important:
            </strong>{' '}
            Submitting a request here does not activate the Sender ID immediately. Our
            team reviews each request, registers it with our SMS provider, and notifies
            you when it becomes available.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] shadow-xs"
            placeholder="Search sender IDs..."
            type="text"
          />
        </div>

        <select
          className="px-3 py-2 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none cursor-pointer sm:w-56"
          defaultValue={senderIdStatusOptions[0]}
        >
          {senderIdStatusOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>

        <button className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-xs">
          <ArrowDownToLine className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
          <span>Export</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <TableScroll>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
                <th className="py-3.5 px-5 whitespace-nowrap">Sender ID</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Purpose</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Requested Date</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Approved Date</th>
                <th className="py-3.5 px-5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {senderIds.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 tracking-wide whitespace-nowrap">
                    {row.value}
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 leading-snug">
                    {row.purpose.split('\n').map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <SenderIdStatusBadge status={row.status} />
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.requestedDate}
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.approvedDate}
                  </td>
                  <td className="py-4 px-5 text-center whitespace-nowrap">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center justify-center transition-colors">
                      <MoreVertical className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        {/* Pagination */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">{p.from} - {p.to}</span> of{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">{p.total}</span> sender IDs
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1a6cf0] text-white text-xs font-semibold shadow-xs">
              1
            </button>
            <button
              disabled
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}