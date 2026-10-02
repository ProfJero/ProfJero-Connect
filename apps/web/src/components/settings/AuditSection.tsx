import { useState } from 'react';
import type { AuditLog } from '@profjero/shared';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { apiFetch, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { splitDateTime } from '../../lib/datetime';
import { cn } from '../../lib/utils';

const CATEGORIES = [
  ['', 'All activity'],
  ['settings', 'Settings'],
  ['team', 'Team'],
  ['projects', 'Projects'],
  ['api_keys', 'API keys'],
  ['sender_ids', 'Sender IDs'],
  ['wallets', 'Wallets'],
  ['payments', 'Payments'],
  ['pricing', 'Pricing'],
  ['providers', 'Providers'],
  ['sms', 'SMS'],
  ['system', 'System'],
] as const;

interface AuditResponse {
  logs: AuditLog[];
  nextCursor: string | null;
}

/** Settings → Audit log: who changed what, newest first. */
export function AuditSection() {
  const [category, setCategory] = useState('');
  const { data, loading, error } = useApi<AuditResponse>(`/admin/audit-logs?limit=30${category ? `&category=${category}` : ''}`);
  const [more, setMore] = useState<{ forKey: unknown; logs: AuditLog[]; cursor: string | null } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const extra = more && more.forKey === data ? more : null;
  const logs = [...(data?.logs ?? []), ...(extra?.logs ?? [])];
  const cursor = extra ? extra.cursor : (data?.nextCursor ?? null);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await apiFetch<AuditResponse>(`/admin/audit-logs?limit=30&before=${encodeURIComponent(cursor)}${category ? `&category=${category}` : ''}`);
      setMore({ forKey: data, logs: [...(extra?.logs ?? []), ...res.logs], cursor: res.nextCursor });
    } catch (err) {
      setMoreError(err instanceof ApiError ? err.message : 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Card>
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Audit log</h3>
          <p className="text-xs text-slate-500 mt-0.5">Every successful change made from this dashboard, with who made it.</p>
        </div>
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      {loading && !data ? (
        <p className="px-6 py-8 text-xs text-slate-500">Loading…</p>
      ) : error ? (
        <p className="px-6 py-8 text-xs text-rose-600">{error.message}</p>
      ) : logs.length === 0 ? (
        <p className="px-6 py-8 text-xs text-slate-500">No activity recorded yet.</p>
      ) : (
        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <tr>
                <th className="px-6 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">What</th>
                <th className="px-4 py-3"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => {
                const when = splitDateTime(l.createdAt);
                const open = expanded === l.id;
                return (
                  <tr key={l.id} className="align-top">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-slate-700">{when.date}</div>
                      <div className="text-[11px] text-slate-400">{when.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{l.actorEmail ?? l.actorUid}</div>
                      <div className="text-[11px] text-slate-400">{l.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 min-w-[240px]">
                      <div className="font-semibold text-slate-800">{l.action}</div>
                      {l.targetId && <div className="text-[11px] text-slate-500 font-mono">{l.targetId}</div>}
                      {open && (
                        <pre className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px] whitespace-pre-wrap break-all text-slate-600">
                          {JSON.stringify({ request: `${l.method} ${l.path}`, requestId: l.requestId, details: l.details }, null, 2)}
                        </pre>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setExpanded(open ? null : l.id)} className={cn('text-[11px] font-semibold hover:underline', open ? 'text-slate-500' : 'text-blue-600')}>
                        {open ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
      {(cursor || moreError) && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-3">
          {moreError && <span className="text-xs text-rose-600">{moreError}</span>}
          {cursor && (
            <button type="button" onClick={loadMore} disabled={loadingMore} className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50">
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
