import { Link } from 'react-router-dom';
import { ChevronRight, Code2 } from 'lucide-react';
import { TableScroll } from '../ui/TableScroll';
import { Badge } from '../ui/Badge';
import { BATCH_STATUS } from '../../lib/statusLabels';
import { formatDateTime } from '../../lib/format';
import type { SmsBatch } from '../../lib/types';

/** Send history rows. Each row opens the per-recipient detail. */
export function BatchesTable({ batches }: { batches: SmsBatch[] }) {
  return (
    <TableScroll>
      <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
        <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800 tracking-wider">
          <tr>
            <th className="py-3 px-5 whitespace-nowrap">Date &amp; Time</th>
            <th className="py-3 px-4 whitespace-nowrap">Sender ID</th>
            <th className="py-3 px-4 whitespace-nowrap">Recipients</th>
            <th className="py-3 px-4 whitespace-nowrap min-w-[260px]">Message</th>
            <th className="py-3 px-4 whitespace-nowrap">Units</th>
            <th className="py-3 px-4 whitespace-nowrap">Status</th>
            <th className="py-3 px-4">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {batches.map((b) => {
            const s = BATCH_STATUS[b.status];
            const href = `/messaging/history/${encodeURIComponent(b.id)}`;
            return (
              <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <Link to={href} className="hover:text-[#1a6cf0]">
                    {formatDateTime(b.createdAt)}
                  </Link>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  {b.senderId ?? '—'}
                  {b.source === 'api' && (
                    <span title="Sent via API" className="ml-1.5 inline-flex align-middle text-purple-500">
                      <Code2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">{b.totalRecipients.toLocaleString()}</td>
                <td className="py-3.5 px-4 max-w-sm truncate" title={b.message}>
                  {b.message}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">{b.totalUnitsCharged.toLocaleString()}</td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge tone={s.tone} label={s.label} />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link to={href} aria-label="View details" className="inline-flex p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={2} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}
